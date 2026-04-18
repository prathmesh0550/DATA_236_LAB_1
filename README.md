DATA 236 Lab-1 

- Overview- This project is a Yelp-style restaurant discovery platform built using:

1. React (Frontend)
2. FastAPI (Backend)
3. MySQL (Database)

The application allows: Users to search restaurants, write reviews, manage favorites, and update profiles/preferences
Owners to claim restaurants, manage listings, and view analytics
AI chatbot to provide restaurant recommendations

-Prerequisites- Make sure you have installed:

1. Python 3.9+
2. Node.js (v16+ recommended)
3. MySQL

- Backend Setup (FastAPI)
1. Can run backend from initial folder
2. Create virtual environment: python -m venv venv
3. Activate virtual environment:
   - Windows: venv\Scripts\activate
   - Mac/Linux: source venv/bin/activate
4. Install dependencies: pip install -r requirements.txt
5. Create a .env file with the following variables:
   DATABASE_URL=mysql+pymysql://root:yourpassword@localhost/yourdbname
   SECRET_KEY=your_secret_key
   ALGORITHM=HS256
   TAVILY_API_KEY=your_tavily_key
   OLLAMA_MODEL=llama3
6. Run database migrations / create tables: python create_tables.py
7. Start backend: uvicorn app.main:app --reload

- Frontend Setup (React)
1. Navigate to frontend: cd frontend
2. Install dependencies : npm install
3. Fix permission issue (Mac only if needed): chmod +x node_modules/.bin/react-scripts
4. Start frontend: npm start

Frontend runs at: http://localhost:3000

- Features:

 - User Features
1. Signup / Login
2. Search restaurants (keyword, city, zip)
3. View restaurant details
4. Add/remove favorites
5. Write, edit, delete reviews
6. View history (reviews + favorites)
7. Profile management
8. Preferences management

- Owner Features:
1. Owner signup / login
2. Claim restaurants
3. Add restaurant
4. Edit restaurant
5. Upload photos
6. View dashboard analytics
7. Filter reviews

- AI Chatbot:
1. Ask for restaurant recommendations
2. Uses keyword + preferences
3. Returns top ranked restaurants

- Notes
1. Backend must be running before frontend
2. Zip code search requires backend support
3. AI chatbot currently uses database-based logic
