# Office IoT Dashboard Notes (Team Handoff)

## 🏢 Device Count Decision
* **The Discrepancy**: The project brief had a small inconsistency where the intro text stated 15 devices (2 fans + 3 lights × 3 rooms) but the floor plan description mentioned 18 devices.
* **The Decision**: We have built for exactly **15 devices** (5 devices per room × 3 rooms) to maintain strict arithmetic consistency across the database, simulator, and dashboard floor plan.
* **Rooms**: `drawingroom`, `workroom1`, `workroom2`
* **Room Composition**: 2 fans + 3 lights = 5 devices per room.

## ⚡ Wattage & Load Constants
* **Fan Wattage**: **60W** (when active, 0W when inactive)
* **Light Wattage**: **15W** (when active, 0W when inactive)
* **Maximum Possible Total Load**: **495W** (calculated as: `(2 * 60W + 3 * 15W) * 3 rooms = 165W * 3 = 495W`)

> [!IMPORTANT]
> **Handoff Warning for Member 3 (Frontend)**: 
> The dashboard power meter gauge should be rescaled to a range of **0–500W** or **0–600W** (rather than 1000W). At a 1000W limit, the gauge will appear less than half-full even under maximum load, which degrades the visual impact in the demo video. Scaling it to 500W or 600W makes the gauge dynamic and highly responsive during the live tick changes.

## 💶 Electricity Rates & Costing
* **BDT/kWh Rate**: **৳8.0** (Bangladesh average commercial/residential rate)
* **Conversion Formula**: `estimatedCost (BDT) = kWh * 8.0`

## 🗄️ Database Location
* **Database File**: `backend/data/history.db` (automatically initialized and kept inside the `data` folder).

## 💾 Backend Scope Handoff (Member 2 Note)
* **Pre-built Components**: The backend Express REST API, Socket.IO WebSockets configuration, and the Alert evaluation engine have been built ahead of schedule to enable end-to-end integration.
* **Handoff Documentation**: Please refer to [docs/HANDOFF.md](file:///media/arkosaha/Volume1/office-iot-dashboard/docs/HANDOFF.md) for the complete list of REST routes, Socket.IO channels, alert rules, and cooldown caches.
* **Ownership**: Member 2 is requested to take ownership of `backend/src/api.js`, `backend/src/socket.js`, and `backend/src/alerts.js` going forward.

