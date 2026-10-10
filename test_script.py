import json

log_file = "/Users/Magtrol/.gemini/antigravity-ide/brain/1741e60f-ff2c-410f-ad5a-82a74546bfcd/.system_generated/logs/transcript.jsonl"
for line in open(log_file):
    try:
        obj = json.loads(line)
        if obj.get("type") == "USER_INPUT" and "generatepaper.tsx" in obj.get("content", "").lower():
            print(f"Found at step: {obj.get('step_index')}")
            print(obj.get("content")[:500] + "\n...\n")
    except Exception:
        pass
