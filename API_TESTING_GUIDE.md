# API Testing Guide — Admin and Super Admin

Branches: `feat-admin` (schema + create APIs + admin CRUD), `feat-super-admin` (super-admin CRUD on top).

## 0. Ground rules

- Base URL: `http://localhost:5000/api/v1` (app mounts router at `/api/v1` in `src/app.ts`).
- Auth = session COOKIE, not Bearer token. `checkAuth` reads Better Auth session via headers.
  Login once, keep cookies for all later requests.
- 401 = no/expired session. 403 = wrong role or inactive account.
- First SUPER_ADMIN bootstrap: POST /auth/register, then set user.role=SUPER_ADMIN in Prisma Studio, then login again.
- Start server: `pnpm dev`.

## 1. Auth helpers (pre-existing)

### 1.1 Register — public
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json
{"name":"Root Super Admin","email":"root@example.com","password":"password123"}
Expected: 201. Then set role to SUPER_ADMIN in DB.

### 1.2 Login — public (GET with JSON body)
GET http://localhost:5000/api/v1/auth/login
Content-Type: application/json
{"email":"root@example.com","password":"password123"}
Expected: 201 + Set-Cookie. Keep cookies.


## 2. Create Admin — Task 1.1
POST http://localhost:5000/api/v1/user/create-admin
Auth: SUPER_ADMIN cookie. Content-Type: application/json.
{"password":"admin12345","admin":{"name":"John Admin","email":"john.admin@example.com","contactNumber":"+1234567890","profilePhoto":"https://example.com/photo.jpg"}}
Minimal: {"password":"admin12345","admin":{"name":"John Admin","email":"john.admin@example.com"}}
Rules: password min 8; name min 1; email valid; profilePhoto valid URL optional; contactNumber optional.
Success: 201 Admin created successfully + data {id,userId,name,email,user:{id,email,role:ADMIN}}.
Errors: dup email 409; no cookie 401; wrong role 403; bad body 400.

## 3. Create Super Admin — Task 1.2
POST http://localhost:5000/api/v1/user/create-super-admin
Auth: SUPER_ADMIN cookie. Content-Type: application/json.
Full: {"password":"super12345","superAdmin":{"name":"Jane Root","email":"jane.root@example.com","contactNumber":"+1987654321","profilePhoto":"https://example.com/jane.jpg"}}
Minimal: {"password":"super12345","superAdmin":{"name":"Jane Root","email":"jane.root@example.com"}}
Success: 201 Super admin created successfully, user.role SUPER_ADMIN.
Errors: same 409/401/403/400 matrix as Section 2.

## 4. Admin CRUD (Tasks 3.1-3.4) — /api/v1/admin

### 4.1 Get All Admins — Task 3.1
GET http://localhost:5000/api/v1/admin
Auth: ADMIN or SUPER_ADMIN cookie. No body.
Success: 200 Admins retrieved successfully, data array each with user.
Note: list does NOT filter isDeleted (mirrors doctor module).

### 4.2 Get Admin by ID — Task 3.2
GET http://localhost:5000/api/v1/admin/:id
Auth: ADMIN or SUPER_ADMIN. Example id: 019c2f7f-87f8-7078-951a-3b2326c8d60a
Success: 200 Admin retrieved successfully. Bad/deleted id: 404 Admin not found.


### 4.3 Update Admin — Task 3.3
PATCH http://localhost:5000/api/v1/admin/:id
Auth: ADMIN or SUPER_ADMIN. Content-Type: application/json.
FLAT body, all fields optional (no wrapper object):
{"name":"John Updated","contactNumber":"+1111111111","profilePhoto":"https://example.com/new.jpg"}
Clear field: {"profilePhoto":null,"contactNumber":null}
Success: 200 Admin updated successfully. Bad id: 404.

### 4.4 Soft Delete Admin — Task 3.4
DELETE http://localhost:5000/api/v1/admin/:id
Auth: ADMIN or SUPER_ADMIN. No body.
Success: 200 Admin deleted successfully (sets isDeleted + deletedAt).
Already-deleted/unknown id: 404 Admin not found.

## 5. Super Admin CRUD (Tasks 4.1-4.4) — /api/v1/super-admin (SUPER_ADMIN only)

### 5.1 Get All — Task 4.1
GET http://localhost:5000/api/v1/super-admin
Success: 200 Super admins retrieved successfully. ADMIN gets 403.

### 5.2 Get by ID — Task 4.2
GET http://localhost:5000/api/v1/super-admin/:id
Success: 200 Super admin retrieved successfully. Bad id: 404 Super admin not found.

### 5.3 Update — Task 4.3
PATCH http://localhost:5000/api/v1/super-admin/:id
Flat body: {"name":"Jane Updated","contactNumber":"+2222222222"}
Success: 200 Super admin updated successfully.

### 5.4 Soft Delete — Task 4.4
DELETE http://localhost:5000/api/v1/super-admin/:id
Success: 200 Super admin deleted successfully.

## 6. Quick reference table

| # | Method | URL | Auth | Body |
|---|--------|-----|------|------|
| 1 | POST | /api/v1/user/create-admin | SUPER_ADMIN | {password, admin:{name,email,contactNumber?,profilePhoto?}} |
| 2 | POST | /api/v1/user/create-super-admin | SUPER_ADMIN | {password, superAdmin:{...}} |
| 3 | GET | /api/v1/admin | ADMIN, SUPER_ADMIN | none |
| 4 | GET | /api/v1/admin/:id | ADMIN, SUPER_ADMIN | none |
| 5 | PATCH | /api/v1/admin/:id | ADMIN, SUPER_ADMIN | flat {name?,email?,profilePhoto?,contactNumber?} |
| 6 | DELETE | /api/v1/admin/:id | ADMIN, SUPER_ADMIN | none |
| 7 | GET | /api/v1/super-admin | SUPER_ADMIN | none |
| 8 | GET | /api/v1/super-admin/:id | SUPER_ADMIN | none |
| 9 | PATCH | /api/v1/super-admin/:id | SUPER_ADMIN | flat |
| 10 | DELETE | /api/v1/super-admin/:id | SUPER_ADMIN | none |

## 7. Negative tests (run per endpoint)

N1 no cookie → 401. N2 DOCTOR on /admin → 403. N3 ADMIN on /super-admin → 403.
N4 bad id → 404. N5 duplicate email → 409. N6 short password → 400.
N7 bad email → 400. N8 bad URL → 400. N9 DELETE then GET → 404.

## 8. Troubleshooting

- 404 everywhere: missing /v1 in path or stale branch. Confirm feat-super-admin + restart pnpm dev.
- 401 after login: cookies not sent. Reuse same Postman tab/collection.
- 403 on create-admin: user is not SUPER_ADMIN. Check user.role in Studio.
- Validation failed on PATCH: don't wrap in {body:{...}} — send flat object.
- Fresh DB: run pnpm prisma migrate dev (migration 20261010130936 already committed).