from datetime import datetime, timezone
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/ws/proctor")
async def proctor_socket(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except Exception:
                data = {"raw": raw_data}

            session_id = data.get("session_public_id", "unknown")
            suspicion = data.get("suspicion_score", 0.0)

            # Echo heartbeat acknowledgment with live server timestamp
            await websocket.send_json(
                {
                    "status": "ack",
                    "session_public_id": session_id,
                    "suspicion_score": suspicion,
                    "server_time": datetime.now(timezone.utc).isoformat(),
                }
            )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print("WebSocket proctor connection closed with error:", e)