# Office IoT Dashboard Notes

## Device Count Decision

The original specification contains a slight inconsistency:
- The introduction text describes **15 devices** (2 fans + 3 lights per room across 3 rooms).
- The floor plan description mentions **18 devices**.

To ensure mathematical consistency across the simulator, backend, and frontend dashboards, we have built the system for **15 devices**:
- **Rooms**: Drawing Room (`drawingroom`), Work Room 1 (`workroom1`), and Work Room 2 (`workroom2`).
- **Devices per Room**: 2 fans + 3 lights = 5 devices/room.
- **Total Devices**: 15 devices.

The device configuration and count are kept as constant configuration values. If the backend is ever modified to support 18 devices (e.g. adding 1 device per room), the frontend coordinates and device list can easily be adjusted.
