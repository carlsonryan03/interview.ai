# Run instructions

Our project uses node.js, which can be installed at https://nodejs.org/en/download or by running this code:

For **Windows** with chocolatey:
    powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
    choco install nodejs --version="24.12.0"
    node -v # Should print "v24.12.0".
    npm -v # Should print "11.6.2".

For **MacOS** and **Linux** with nvm:
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    \. "$HOME/.nvm/nvm.sh"
    nvm install 24
    node -v # Should print "v24.12.0".
    npm -v # Should print "11.6.2".

Next, install the required npm libraries:

    npm install bcryptjs jsonwebtoken sqlite3
    npm install dotenv

**Run the backend:**

Open a terminal and navigate to 'interview.ai/interviewai/server' and run the backend:

    cd interview.ai/interviewai/server
    npm run dev

**Run the frontend:**

Open a new terminal and nagivate to 'interview.ai/interviewai/src' and run the frontend:

    cd interview.ai/interviewai/src
    npm run dev

**Go to the website:**

Enter 'http://localhost:5173/' on your web browser.