import argparse
import json
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, DataCollatorForLanguageModeling, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model


def load_jsonl(path):
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def format_example(ex):
    # Simple chat-style prompt
    return f"User: {ex['input']}\nAssistant: {ex['reply']}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument("--output_dir", required=True)
    parser.add_argument("--model_id", default="distilgpt2")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--max_length", type=int, default=128)
    args = parser.parse_args()

    tokenizer = AutoTokenizer.from_pretrained(args.model_id)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(args.model_id)

    lora = LoraConfig(
        r=8,
        lora_alpha=16,
        target_modules=["c_attn", "c_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora)

    rows = load_jsonl(args.data)
    texts = [format_example(r) for r in rows]
    ds = Dataset.from_dict({"text": texts})

    def tokenize(batch):
        return tokenizer(batch["text"], truncation=True, max_length=args.max_length)

    tokenized = ds.map(tokenize, batched=True, remove_columns=["text"])

    collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        learning_rate=args.lr,
        logging_steps=10,
        save_steps=200,
        save_total_limit=2,
        fp16=False,
        bf16=False,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
        data_collator=collator,
    )

    trainer.train()
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)


if __name__ == "__main__":
    main()
