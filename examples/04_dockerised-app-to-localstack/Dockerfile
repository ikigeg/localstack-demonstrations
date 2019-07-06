FROM node:8-alpine

# So our script knows it is in docker
ENV DOCKER_INSTANCE=true

# Suppress npm info logs that are on by default
ENV NPM_CONFIG_LOGLEVEL=warn

# Suppress npm update notification
ENV NO_UPDATE_NOTIFIER=true

# aws-sdk uses the awscli tool under the hood, which in turn requires a credentials file
RUN mkdir ~/.aws && \
  touch ~/.aws/credentials && \
  echo -e "[default]\naws_access_key_id=someId\naws_secret_access_key=someKey\n" >> ~/.aws/credentials

# Create the directory that will contain the app, and make subsequent commands run from this directory
WORKDIR /src

# Install dependencies for modules that require compilation, tracked via .build-deps to be tidied up later
COPY . .

CMD ["npm", "run", "example-4-index"]
