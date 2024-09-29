FROM python:3.12-alpine

# To get working -x flag in ps command in alpine image we need to install procps package. 
# Here we would use bullseye as base image but its a lot bigger so its better to use alpine.
# See for eg: https://github.com/dotnet/vscode-csharp/issues/2165
# For using psutil with alpine we need to install also gcc, python3-dev, musl-dev, linux-headers
RUN apk update && apk add --no-cache procps gcc python3-dev musl-dev linux-headers

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip3 install -r requirements.txt

COPY . .

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]