# Localstack Demonstrations

This is a small set of examples of how, why, and when to use localstack, when dealing with AWS related projects. It is by no means a comprehensive list, but will touch on a few real life scenarios I have encountered.

## What is localstack?

"Originally developed by Atlassian but now developed independently, LocalStack allows you to emulate AWS cloud services directly from your computer. For anybody toying around with AWS, this means you can perfect your skills without risking a hefty bill. If you use AWS for your work or personal projects, you can prototype your work locally before pushing into production." - [Andrew Alkhouri](https://medium.com/@andyalky/developing-aws-apps-locally-with-localstack-7f3d64663ce4)

Localstack info can be found on [github](https://github.com/localstack/localstack) and [website](https://localstack.cloud/) 

## How do we use it?

First things first, you need to somehow install localstack. My preferred method of doing this is with docker, but you can install it globally to your machine for a more permanent solution.

### Installing

#### Installing and running locally

Via pip `pip install localstack` **NOTE** don't use `sudo` or `root`
Once installed, run with `localstack start`

#### Running via Docker

The `SERVICES` env var is a comma delimited string of all the services you want to use, each has a corresponding port that you have to expose, or you can just go ahead and expose the entire range.

`docker run -d -p "4567-4592:4567-4592" -e SERVICES=s3,sts --name my_localstack localstack/localstack`

#### Running via docker-compose file

Simply add on the services you require, as well as the correct image to your existing docker-compose file. As above the `SERVICES` env var is a comma delimited string of all the services you want to use, each has a corresponding port that you have to expose, or you can just go ahead and expose the entire range.

```
version: '3'

services:
  my-service:
    build: .
    depends_on:
      - localstack
  localstack:
    container_name: localstack
    image: localstack/localstack
    ports:
      - "8080:8080"
      - "4567-4592:4567-4592"
    environment:
      - SERVICES=s3,sts
```

Now when you spin it up, your containers will be able to communicate with `http://localstack:<port-of-service>`, example command:

`docker-compose -f docker-compose.localstack.yaml up --build -d`

It is worth noting that I had to implement an extra script that waits for the localstack service to come online before my service could interact with it - roughly 10 seconds, but you can be more intelligent with s3 and wait for a bucket to become available. You can find the script included in the `./useful/` folder.

### Interacting with your services

This will obviously vary according to what services you are using, but typically you are going to be doing everything via the [awscli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) tool, or some manner of [aws-sdk](https://aws.amazon.com/tools/) (eg. [node.js](https://aws.amazon.com/sdk-for-node-js/), [.net](https://aws.amazon.com/sdk-for-net/), etc.).

#### S3

First spin up your localstack instance. Once it is up and running you are going to be using the awscli for these examples... pay particular attention to the `--endpoint` argument which points it at the localstack endpoint:

* List available buckets: `aws --endpoint-url=http://localhost:4572 s3api list-buckets`
* Create a bucket: `aws --endpoint-url=http://localhost:4572 s3api create-bucket --acl public-read-write --bucket my-bucket --region eu-west-1`
* Upload a file to a bucket: `aws --endpoint-url=http://localhost:4572 s3 cp README.md s3://my-bucket/`
* List bucket contents: `aws --endpoint-url=http://localhost:4572 s3 ls s3://my-bucket/`
* Download a file from a bucket: `aws --endpoint-url=http://localhost:4572 s3 cp s3://my-bucket/README.md .`

*NOTE* With Docker instances, unless you have setup a data directory, localstack S3 is saving to memory. Consequently when you stop the container all buckets and files will be deleted.

**More info** [s3 reference](https://docs.aws.amazon.com/cli/latest/reference/s3/)

#### STS

This is the role mananging service for AWS, and what you are interacting with whenever you have to assume different roles. The localstack version of this is super basic, and doesn't actually do anything other than return the same credentials each time, but does let you simulate the interaction. To assume the role run the following, replacing AWS_ROLE to match the expected ARN of the role, and the ROLE_SESSION_NAME as an identifier for the session:

```
aws --endpoint-url=http://localhost:4592 sts assume-role --role-arn "arn:aws:sts::123456789012" --role-session-name "ROLE_SESSION_NAME"
```

The above command will give you a JSON object resembling:

```
{
    "AssumedRoleUser": {
        "AssumedRoleId": "AROA3XFRBF535PLBIFPI4:s3-access-example",
        "Arn": "arn:aws:sts::123456789012:assumed-role/xaccounts3access/s3-access-example"
    },
    "Credentials": {
        "SecretAccessKey": "9drTJvcXLB89EXAMPLELB8923FB892xMFI",
        "SessionToken": "some-token",
        "Expiration": "2016-03-15T00:05:07Z",
        "AccessKeyId": "ASIAJEXAMPLEXEG2JICEA"
    }
}
```

You will find an example bash script for assuming roles in the `./useful/` folder.

**More info** [sts reference](https://docs.aws.amazon.com/cli/latest/reference/sts/)

## Example Scenarios

These are all derived from real projects, but with names changed to protect the innocent. You can find them in the `./examples` folder, but here is an overview of each:

* `./examples/01_s3-fetch-parse`: Downloading multiple files from a bucket, parsing, outputting file. Run with `npm run example-1`
* `./examples/02_sts-assume-s3-push-via-nodejs`: Assume a role, push a file to S3 as role via node.js. Run with `npm run example-2`
* `./examples/03_sts-assume-via-bash-s3-push-via-nodejs`: Same as above, but them deployment is done from within Docker. Run with `npm run example-3`
* `./examples/04_dockerised-app-to-localstack`: Spins up a docker-compose with app and localstack S3. Run with `npm run example-4`
  
**TODO**

Lambda example

## Presentation stages

1. AWS overview
2. Localstack overview - list all possible services
3. Running localstack
4. Interacting with localstack
   1. Create bucket
   2. Upload files
   3. list files
   4. Download files
   5. Assume roles
5. Example 1
   1. Upload 2000 files
   2. Show the files in the data directory
   3. List the files from the bucket
   4. Download and parse 2000 files
6. Example 2
   1. Assume a role
   2. Push to S3 as that role
   3. List the uploaded files

