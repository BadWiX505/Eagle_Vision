import type { Camera } from "@/types";

export const MOCK_CAMERAS: Camera[] = [
  {
    id: "cam-001",
    name: "North Gate Alpha",
    zone: "zone-a",
    direction: "south",
    streamUrl: "http://localhost:5000/api/stream/video_feed",
    status: "online",
  },
  {
    id: "cam-002",
    name: "North Stand Upper",
    zone: "zone-a",
    direction: "south",
    streamUrl: "/mock/stream/cam-002",
    status: "online",
  },
  {
    id: "cam-003",
    name: "East Entrance",
    zone: "zone-b",
    direction: "west",
    streamUrl: "/mock/stream/cam-003",
    status: "online",
  },
  {
    id: "cam-004",
    name: "East Stand Row 12",
    zone: "zone-b",
    direction: "west",
    streamUrl: "/mock/stream/cam-004",
    status: "offline",
  },
  {
    id: "cam-005",
    name: "South Gate Primary",
    zone: "zone-c",
    direction: "north",
    streamUrl: "/mock/stream/cam-005",
    status: "online",
  },
  {
    id: "cam-006",
    name: "South Concourse",
    zone: "zone-c",
    direction: "north",
    streamUrl: "/mock/stream/cam-006",
    status: "online",
  },
  {
    id: "cam-007",
    name: "West VIP Lounge",
    zone: "zone-d",
    direction: "east",
    streamUrl: "/mock/stream/cam-007",
    status: "online",
  },
  {
    id: "cam-008",
    name: "West Tunnel Exit",
    zone: "zone-d",
    direction: "east",
    streamUrl: "/mock/stream/cam-008",
    status: "offline",
  },
];

export const MOCK_ZONES = [
  { id: "zone-a", label: "Zone A", description: "North Stand", color: "#00d4ff" },
  { id: "zone-b", label: "Zone B", description: "East Stand", color: "#8b5cf6" },
  { id: "zone-c", label: "Zone C", description: "South Stand", color: "#0066ff" },
  { id: "zone-d", label: "Zone D", description: "West VIP", color: "#00ff88" },
];
