import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const invokeSpy = vi.fn();
let invokeImpl: (...args: unknown[]) => Promise<unknown> = () =>
  Promise.resolve(null);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => {
    invokeSpy(...args);
    return invokeImpl(...args);
  },
}));

import { CidrTool } from "./CidrTool";

beforeEach(() => {
  invokeSpy.mockReset();
  invokeImpl = () => Promise.resolve(null);
});

describe("CidrTool", () => {
  it("computes an IPv4 /24 subnet", async () => {
    invokeImpl = () =>
      Promise.resolve({
        version: 4,
        network: "192.168.1.0",
        prefixLen: 24,
        netmask: "255.255.255.0",
        hostMask: "0.0.0.255",
        broadcast: "192.168.1.255",
        firstHost: "192.168.1.1",
        lastHost: "192.168.1.254",
        usableHosts: "254",
        totalAddresses: "256",
      });
    render(<CidrTool />);
    fireEvent.change(screen.getByLabelText("CIDR block"), {
      target: { value: "192.168.1.0/24" },
    });
    expect(await screen.findByText("192.168.1.255")).toBeInTheDocument();
    expect(screen.getByText("0.0.0.255")).toBeInTheDocument();
    expect(screen.getByText("254")).toBeInTheDocument();
    expect(invokeSpy).toHaveBeenCalledWith(
      "run_action",
      expect.objectContaining({ action: "cidr.parse" }),
    );
  });

  it("computes an IPv4 /30 subnet", async () => {
    invokeImpl = () =>
      Promise.resolve({
        version: 4,
        network: "10.0.0.0",
        prefixLen: 30,
        netmask: "255.255.255.252",
        hostMask: "0.0.0.3",
        broadcast: "10.0.0.3",
        firstHost: "10.0.0.1",
        lastHost: "10.0.0.2",
        usableHosts: "2",
        totalAddresses: "4",
      });
    render(<CidrTool />);
    fireEvent.change(screen.getByLabelText("CIDR block"), {
      target: { value: "10.0.0.0/30" },
    });
    expect(await screen.findByText("10.0.0.3")).toBeInTheDocument();
    expect(screen.getByText("10.0.0.2")).toBeInTheDocument();
  });

  it("computes an IPv6 block and omits IPv4-only rows", async () => {
    invokeImpl = () =>
      Promise.resolve({
        version: 6,
        network: "2001:db8::",
        prefixLen: 32,
        netmask: "ffff:ffff::",
        hostMask: "",
        broadcast: "",
        firstHost: "2001:db8::",
        lastHost: "2001:db8:ffff:ffff:ffff:ffff:ffff:ffff",
        usableHosts: "79228162514264337593543950336",
        totalAddresses: "79228162514264337593543950336",
      });
    render(<CidrTool />);
    fireEvent.change(screen.getByLabelText("CIDR block"), {
      target: { value: "2001:db8::/32" },
    });
    expect(await screen.findByText("IPv6")).toBeInTheDocument();
    // For IPv6 the usable-hosts and total-addresses rows carry the same value.
    expect(
      screen.getAllByText("79228162514264337593543950336").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Broadcast")).not.toBeInTheDocument();
    expect(screen.queryByText("Host Mask")).not.toBeInTheDocument();
  });

  it("shows an error for a malformed block", async () => {
    invokeImpl = () =>
      Promise.reject({
        kind: "invalid_input",
        message: "not a valid CIDR block or IP address: nope",
      });
    render(<CidrTool />);
    fireEvent.change(screen.getByLabelText("CIDR block"), {
      target: { value: "nope" },
    });
    expect(await screen.findByText("Invalid CIDR block")).toBeInTheDocument();
  });
});
