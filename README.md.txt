# URL Shortener API

A robust URL shortening service built with Node.js, Express, and PostgreSQL. Create short, shareable links with custom codes, expiration dates, and analytics tracking.

## Features

- ✂️ Shorten long URLs to compact, shareable links
- 🎨 Custom short codes (choose your own memorable URLs)
- ⏰ Optional expiration dates
- 📊 Click tracking and analytics
- 🔍 List all shortened URLs
- ❌ Delete unwanted URLs
- ✅ URL validation
- 🧪 Comprehensive test coverage

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma 6
- **Testing:** Jest + Supertest
- **Dev Tools:** Nodemon

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (or Supabase account)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/url-shortener.git
cd url-shortener
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```
DATABASE_URL="postgresql://user:password@host:5432/database"
PORT=3000
```

4. **Run database migrations**
```bash
npx prisma migrate dev
```

5. **Start the development server**
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## API Documentation

### Create Short URL

**POST** `/api/shorten`

Create a shortened URL.

**Request Body:**
```json
{
  "originalUrl": "https://www.example.com",
  "customCode": "mycode",  // Optional
  "expiresInDays": 7       // Optional
}
```

**Response:** `201 Created`
```json
{
  "shortCode": "mycode",
  "originalUrl": "https://www.example.com",
  "shortUrl": "http://localhost:3000/mycode"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid URL or custom code
- `409 Conflict` - Custom code already taken

---

### Redirect to Original URL

**GET** `/:shortCode`

Redirects to the original URL and increments click count.

**Example:** `http://localhost:3000/mycode` → Redirects to `https://www.example.com`

**Error Responses:**
- `404 Not Found` - Short code doesn't exist
- `410 Gone` - URL has expired

---

### Get Analytics

**GET** `/api/analytics/:shortCode`

Get statistics for a shortened URL.

**Response:** `200 OK`
```json
{
  "shortCode": "mycode",
  "originalUrl": "https://www.example.com",
  "clicks": 42,
  "createdAt": "2025-01-13T10:00:00.000Z",
  "expiresAt": "2025-01-20T10:00:00.000Z"
}
```

---

### List All URLs

**GET** `/api/urls`

Get all shortened URLs.

**Response:** `200 OK`
```json
{
  "count": 5,
  "urls": [
    {
      "id": 1,
      "shortCode": "mycode",
      "originalUrl": "https://www.example.com",
      "clicks": 42,
      "createdAt": "2025-01-13T10:00:00.000Z",
      "expiresAt": null
    }
  ]
}
```

---

### Delete URL

**DELETE** `/api/:shortCode`

Delete a shortened URL.

**Response:** `200 OK`
```json
{
  "message": "Short URL deleted successfully",
  "shortCode": "mycode"
}
```

**Error Responses:**
- `404 Not Found` - Short code doesn't exist

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Project Structure
```
url-shortener/
├── src/
│   ├── controllers/
│   │   └── urlController.js      # Business logic
│   ├── routes/
│   │   └── urlRoutes.js          # API routes
│   ├── utils/
│   │   ├── shortCodeGenerator.js # Short code generation
│   │   └── validateUrl.js        # URL validation
│   ├── db/
│   │   └── prisma.js             # Prisma client instance
│   └── index.js                  # Express server setup
├── tests/
│   ├── url.test.js               # API endpoint tests
│   └── utils.test.js             # Utility function tests
├── prisma/
│   └── schema.prisma             # Database schema
├── .env                          # Environment variables
├── package.json
└── README.md
```

## Database Schema
```prisma
model ShortenedUrl {
  id          Int       @id @default(autoincrement())
  shortCode   String    @unique
  originalUrl String
  clicks      Int       @default(0)
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?
}
```

## Future Enhancements

- [ ] User authentication and accounts
- [ ] Rate limiting
- [ ] Redis caching for popular URLs
- [ ] QR code generation
- [ ] Advanced analytics (geographic data, referrers)
- [ ] Batch URL creation
- [ ] API key authentication
- [ ] Custom domains

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Contact

Your Name - [your.email@example.com](mailto:your.email@example.com)

Project Link: [https://github.com/yourusername/url-shortener](https://github.com/yourusername/url-shortener)
```

---

**Step 2: Customize it**

Update these sections with your info:
- Replace "yourusername" with your GitHub username
- Add your name and email in the Contact section
- Add your actual repository URL

---

**Step 3: Add a .gitignore file**

Create `.gitignore` in your project root:
```
# Dependencies
node_modules/

# Environment variables
.env

# Test coverage
coverage/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*