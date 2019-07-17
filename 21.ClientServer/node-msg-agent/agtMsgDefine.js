'strict'

const Type = {
    REQ: 1,
    RSP: 2,
    KEEPALIVE: 3,
};

const Name = {
    KEEPALIVE: 0 ,
    BIND: 1,
    UNBIND: 2,
    SUBMIT: 3,
    REPORT: 4,
    READREPLY: 5
};

const Msg = {
    SMS: 0,
    LMS: 1,
    MMS: 2,
}

module.exports = {
    Type,
    Name,
    Msg,
}