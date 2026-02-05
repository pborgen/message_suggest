import json
from datasets import load_dataset


def main():
    # Try canonical and legacy dataset names
    try:
        ds = load_dataset("Samsung/samsum")
    except Exception:
        ds = load_dataset("samsum")

    # Use train split; optionally extend with validation if desired
    train = ds["train"]

    out_path = "data/train.jsonl"
    with open(out_path, "w") as f:
        for row in train:
            dialog = row["dialogue"]
            lines = [l.strip() for l in dialog.split("\n") if l.strip()]

            # Extract alternating speaker lines; build adjacent pairs
            # Format: "speaker: message"
            messages = []
            for line in lines:
                if ":" in line:
                    _, msg = line.split(":", 1)
                    msg = msg.strip()
                    if msg:
                        messages.append(msg)

            # Build (input -> reply) pairs from adjacent turns
            for i in range(len(messages) - 1):
                ex = {"input": messages[i], "reply": messages[i + 1]}
                f.write(json.dumps(ex) + "\n")

    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
