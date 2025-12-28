# Running `psql` Commands in Docker — Common Mistake & Fix

This README documents a real debugging scenario involving running `psql` commands inside a Dockerized PostgreSQL instance, where the SQL migration file existed **on the host machine** instead of inside the container.

The goal of this document is to help avoid the same mistake in the future.

---

## ❌ Problem

While trying to run a SQL migration file inside a Docker Postgres container, the following command was executed from **inside `psql` shell**:

```
psql -d chat_app -f prisma/migrations/.../add_constraints.sql
```

This produced:

```
ERROR: syntax error at or near "psql"
```

Because inside `psql`, the command was interpreted as SQL.

Later, running from Windows resulted in:

```
'psql' is not recognized as an internal or external command
```

And running inside Docker produced:

```
FATAL: role "root" does not exist
```

Finally, when referencing the file:

```
No such file or directory
```

The root cause:

> The SQL file existed **on the host machine**, not inside the container filesystem.

So Postgres could not see or read it.

---

## ✅ Key Lessons Learned

### 1️⃣ Inside `psql`, use `\i`, not `psql -f`

```
\i path/to/file.sql
```

---

### 2️⃣ When running from Docker, always specify DB user

```
psql -U <username> -d <database>
```

---

### 3️⃣ Files on the HOST are NOT visible inside the container

Relative paths like

```
server/prisma/migrations/...
```

do **not** exist in the container unless mounted or copied.

---

## 🎯 Correct & Recommended Solution (Windows Friendly)

Instead of copying files into the container, **pipe the SQL file into Postgres**:

```
docker exec -i <container_name> psql -U <db_user> -d <db_name> < path/to/file.sql
```

Example used:

```
docker exec -i chat_postgres psql -U chat_user -d chat_app < prisma/migrations/20251228195245_init/add_constraints.sql
```

This works because the file is read **from the host**, then streamed into the running container via STDIN.

✔ No file copying  
✔ No path issues  
✔ Works on Windows, Mac, Linux  

---

## ⚠️ Important Note for Windows Users

Do **NOT** use Linux line‑continuation slashes (`\`) in commands like:

```
docker exec -i chat_postgres \
  psql ...
```

On Windows, this causes:

```
exec: "\" executable file not found
```

Always run commands as ONE LINE instead.

---

## 🛠 Alternative Options (If Needed)

### Option B — Copy file into container

```
docker cp path/to/file.sql chat_postgres:/tmp/file.sql
docker exec -it chat_postgres psql -U chat_user -d chat_app -f /tmp/file.sql
```

---

### Option C — Mount project folder into container (dev‑friendly)

```
volumes:
  - ./server:/app/server
```

Then run file from:

```
/app/server/prisma/migrations/...
```

---

## ✅ Final Takeaway

> When your SQL file is on the host machine and Postgres is inside Docker, the safest and simplest way to run migrations is:

```
docker exec -i <container> psql -U <user> -d <db> < <file.sql>
```

This prevents path issues, avoids copying files, and works reliably across systems.

---

If you repeat this workflow in the future, refer back to this guide 🙂
