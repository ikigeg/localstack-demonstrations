FROM node:8-alpine

# Suppress npm info logs that are on by default
ENV NPM_CONFIG_LOGLEVEL=warn

# Suppress npm update notification
ENV NO_UPDATE_NOTIFIER=true

# Create the directory that will contain the app, and make subsequent commands run from this directory
WORKDIR /src

# Install dependencies for modules that require compilation, tracked via .build-deps to be tidied up later
COPY . .

# # Ensure that the container operates with a user of no power
# USER nobody

# EXPOSE 3000
# CMD ["node", "server"]
