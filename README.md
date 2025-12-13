# Description
Interview.ai is a fully vibe-coded node.js application created for the Colorado School of Mines Full-Stack LLMs course. This application utilizes a groq-based chat system to prompt users with coding interview questions of varying topics and difficulty and can compile/run any Judge0 supported language, including python, c, c++, java, javascript, go, r, bash, haskell, lisp, and many more. It must (currently) be run locally with the instructions below. 

# Run instructions

If you have already configured the `.env` files, skip to the installations step.

## Get API keys
Navigate here to setup a Judge0 API key: https://rapidapi.com/judge0-official/api/judge0-ce/pricing

Navigate here to setup a groq API key: https://console.groq.com/keys

## Environment setup
Create a `.env` file in the `interview.ai/interviewai` directory. Give it the following structure:
```
    VITE_JUDGE0_URL=https://api.judge0.com
    JUDGE0_KEY=your_judge0_api_key
```

Create another `.env` file in the `interview.ai/interviewai/server` directory. Give it the following structure:
*Note: JWT_secret is a passphrase you set to protect your local user database. This can be set to any passphrase you want. Do not share it with others.*
```
    PORT=3001
    JUDGE0_URL=https://judge0-ce.p.rapidapi.com/
    JUDGE0_KEY=your_judge0_api_key
    JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
    GROQ_API_KEY=your_groq_api_key
    JWT_SECRET=your_jwt_secret
```

## Installations

Our project uses node.js, which can be installed for your OS at https://nodejs.org/en/download (**RECOMMENDED**) or by running this code:

For **Windows** with chocolatey:
```
    powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
    choco install nodejs --version="24.12.0"
    node -v # Should print "v24.12.0".
    npm -v # Should print "11.6.2".
```

For **MacOS** and **Linux** with nvm:
```    
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    \. "$HOME/.nvm/nvm.sh"
    nvm install 24
    node -v # Should print "v24.12.0".
    npm -v # Should print "11.6.2".
```

Next, install the required npm libraries:

    npm install bcryptjs jsonwebtoken sqlite3
    npm install dotenv

## Running

**Run the backend:**

Open a terminal and navigate to `interview.ai/interviewai/server` and run the backend:

    cd interview.ai/interviewai/server
    npm run dev

**Run the frontend:**

Open a new terminal and nagivate to `interview.ai/interviewai/src` and run the frontend:

    cd interview.ai/interviewai/src
    npm run dev

**Go to the website:**

Enter http://localhost:5173/ on your web browser.