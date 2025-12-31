FROM node:20-alpine

WORKDIR /app

# 1️⃣ Copy package files
COPY package*.json ./

# 2️⃣ Copy Prisma schema EARLY
COPY prisma ./prisma
COPY prisma.config.ts ./

# 3️⃣ Install deps (prisma generate now works)
RUN npm install

# 4️⃣ Copy the rest of the source code
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
