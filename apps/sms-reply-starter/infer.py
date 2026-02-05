import argparse
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_dir", required=True)
    parser.add_argument("--base_model", default="distilgpt2")
    parser.add_argument("--input", required=True)
    parser.add_argument("--max_new_tokens", type=int, default=60)
    args = parser.parse_args()

    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    base = AutoModelForCausalLM.from_pretrained(args.base_model)
    model = PeftModel.from_pretrained(base, args.model_dir)
    model.eval()

    prompt = f"User: {args.input}\nAssistant:"
    inputs = tokenizer(prompt, return_tensors="pt")

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=args.max_new_tokens,
            do_sample=True,
            temperature=0.8,
            top_p=0.9,
        )

    text = tokenizer.decode(output[0], skip_special_tokens=True)
    # Print only the assistant reply
    if "Assistant:" in text:
        print(text.split("Assistant:")[-1].strip())
    else:
        print(text)


if __name__ == "__main__":
    main()
