# COMP.SE.140-exercises

Repository for COMP.SE.140 Continuous Development and Deployment - DevOps -course exercises

## Exercise 1

Branch `exercise1` contains exercise 1 submission and it can be tested as follows:

```
git clone -b exercise1 https://github.com/masaoskari/COMP.SE.140-exercises.git
cd COMP.SE.140-exercises

docker-compose up -–build

# wait for ~10 s...

curl localhost:8199
docker-compose down
```

## Exercise 4

Branch `exercise4` contains exercise 4 submission and it can be tested as follows:

```
git clone -b exercise4 https://github.com/masaoskari/COMP.SE.140-exercises.git
cd COMP.SE.140-exercises

docker-compose up -–build

# wait for ~10 s...

point browser at localhost:8198

# With 'request' button you can get the service information
# With 'stop' button you can stop all containers

docker-compose down
```
