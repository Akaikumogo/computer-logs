# Ollama Local AI Setup Guide

## 1. Ollama ni o'rnatish

### macOS da:

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Linux da:

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows da:

[Ollama website](https://ollama.ai/download) dan yuklab oling

## 2. Ollama ni ishga tushirish

```bash
ollama serve
```

## 3. Model yuklab olish

```bash
# Kichik va tez model (3B parameters)
ollama pull llama3.2:3b

# Yoki kattaroq model (7B parameters) - sifatliroq natijalar
ollama pull llama3.2:7b

# Yoki o'zbek tilida yaxshi ishlaydigan model
ollama pull qwen2.5:7b
```

## 4. Environment variables sozlash

`.env` faylga qo'shing:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

## 5. Test qilish

```bash
# Ollama ishlayotganini tekshirish
curl http://localhost:11434/api/tags

# Test prompt yuborish
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "Hello, how are you?",
    "stream": false
  }'
```

## 6. Performance sozlamalari

### Model haqida ma'lumot:

- **llama3.2:3b** - Tez, kam xotira (2-4GB RAM)
- **llama3.2:7b** - Sifatli, o'rtacha xotira (4-8GB RAM)
- **qwen2.5:7b** - O'zbek tilida yaxshi, o'rtacha xotira

### Xotira optimizatsiyasi:

```bash
# GPU dan foydalanish (agar mavjud bo'lsa)
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS=*
```

## 7. Troubleshooting

### Ollama ishlamayapti:

```bash
# Process ni topish
ps aux | grep ollama

# Port ni tekshirish
lsof -i :11434

# Qayta ishga tushirish
pkill ollama
ollama serve
```

### Model yuklanmayapti:

```bash
# Disk bo'sh joyini tekshiring
df -h

# Model cache ni tozalash
ollama rm llama3.2:3b
ollama pull llama3.2:3b
```

## 8. Monitoring

```bash
# Model status
ollama list

# System resources
ollama ps
```

## Afzalliklari:

✅ **Cheklovsiz** - API rate limiting yo'q  
✅ **Offline** - Internet kerak emas  
✅ **Xavfsiz** - Ma'lumotlar sizning serveringizda  
✅ **Tejadi** - API to'lovi yo'q  
✅ **Customizable** - Model va sozlamalarni o'zgartirishingiz mumkin

## Kamchiliklari:

❌ **Xotira** - Model uchun RAM kerak  
❌ **Performance** - Cloud AI ga qaraganda sekinroq  
❌ **Setup** - Dastlabki sozlash kerak
