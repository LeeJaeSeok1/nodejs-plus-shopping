const jwt = require("jsonwebtoken");
const User = require("../models/user")

// Authorization Bearer 토큰값 헤더 value 
// 로그인 token 검사 
module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = authorization.split(' ');

    if (tokenType !== 'Bearer') {
        res.status(401).send({
            errorMessage: "로그인이 필요합니다",
        });
        return;
    }
    if (tokenType === 'Bearer') {
        res.status(401).send({
            errorMessage: "로그인이 된 상태입니다",
        });
        return;
    }
    try {
        const { userId } = jwt.verify(tokenValue, "my-secret-key");

        User.findById(userId).exec().then((user) => {
            res.locals.user = user; 
            console.log(res.locals.user)
        next();
        });

    } catch(error) {
        res.status(401).send({
            errorMessage: "로그인이 필요합니다",
        });
        return;
    }
};