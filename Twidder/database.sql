CREATE TABLE if NOT EXISTS loggedInUsers(
    email VARCHAR(50),
    token VARCHAR(50),
    PRIMARY KEY (email)
);

CREATE TABLE if NOT EXISTS users(
    email VARCHAR(50),
    password VARCHAR(50),
    firstName VARCHAR(50),
    familyName VARCHAR(50),
    gender VARCHAR(50),
    city VARCHAR(50),
    country VARCHAR(50),
    PRIMARY KEY (email)
);

CREATE TABLE if NOT EXISTS messages(
    fromUser VARCHAR(50),
    toUser VARCHAR(50),
    content VARCHAR(255)
)