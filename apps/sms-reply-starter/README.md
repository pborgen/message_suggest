# SMS Reply Generation Starter (PyTorch + LoRA)

Lightweight starter to fine-tune a small causal LM for SMS-style replies on a MacBook.
Uses **DistilGPT2** + **LoRA** for fast training.

## Dataset format
JSONL with `{ "input": "...", "reply": "..." }` per line.

Example:
```jsonl
{"input":"On my way, be there in 10","reply":"Sounds good! See you soon."}
{"input":"Can you pick up milk?","reply":"Yep, grabbing it now."}
```

### Build dataset from SAMSum
```bash
python prepare_samsum.py
```
This downloads `Samsung/samsum` from Hugging Face and creates `data/train.jsonl` using adjacent turns in each conversation.

## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Train
```bash
python train.py \
  --data data/train.jsonl \
  --output_dir output/sms-distilgpt2-lora \
  --epochs 3 \
  --batch_size 4 \
  --lr 2e-4
```

## Inference
```bash
python infer.py \
  --model_dir output/sms-distilgpt2-lora \
  --input "Running 5 min late"
```

## Export for llama.cpp / vLLM / HF
This starter saves a standard Hugging Face model directory:
```
output/sms-distilgpt2-lora/
  - adapter_config.json
  - adapter_model.safetensors
  - config.json
  - tokenizer.json / tokenizer_config.json
```

If you want a **merged** model (for tools that don't support LoRA adapters):
```bash
python - <<'PY'
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
base_id = "distilgpt2"
peft_dir = "output/sms-distilgpt2-lora"
merge_dir = "output/sms-distilgpt2-merged"
model = AutoModelForCausalLM.from_pretrained(base_id, torch_dtype=torch.float16)
model = PeftModel.from_pretrained(model, peft_dir)
model = model.merge_and_unload()
model.save_pretrained(merge_dir)
AutoTokenizer.from_pretrained(base_id).save_pretrained(merge_dir)
print("Merged saved to", merge_dir)
PY
```

For **vLLM**, load the merged directory:
```bash
# Example
python -m vllm.entrypoints.openai.api_server --model output/sms-distilgpt2-merged
```

## Notes
- Keep dataset small for quick experiments.
- If you want TinyLlama instead, swap `distilgpt2` with a small HF model ID and adjust max length.
