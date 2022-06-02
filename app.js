const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user")
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middlewares/auth-middleware");
const res = require("express/lib/response");
const Joi = require("joi");
const Articles = require("./schemas/article");
const Comment = require("./schemas/comment");
const { create } = require("./models/user");

mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));


const app = express();
// 라우터
const router = express.Router();

// 미들웨어 
app.use(express.json())
app.use("/api", express.urlencoded({ extended: false }), router);
    
// joi 
const schema = Joi.object({
    nickname: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{4,30}$')),
    confirmPassword: Joi.ref('password'),
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    })


// req res
router.post("/users", async (req, res) => {
    // 비구조화 할당 
    const { nickname, email, password, confirmPassword } = req.body;


    // 회원가입 패스워드 여부
    if (password !== confirmPassword) {
        res.status(400).send({
            errorMesseage: '패스워드가 패스워드 확인란과 동일하지 않습니다.',
        });
        return;
    }
    
    // 닉네임 값은 값 포함 패스워드 여부
    if (nickname === password) {
        res.status(400).send({
            errorMesseage: '에러.',
        });
        return;
    }
    // 이메일 닉네임 여부 확인 
    const existUsers = await User.find({
        $or: [ {nickname} ],
    });
    if (existUsers.length) {
        res.status(400).send({
            errorMesseage: '중복된 닉네임이 있습니다.',
        });
        return;
    }
    
    // joi 사용 닉네임 특수문자 글자수 검사
    // try {
    //     await schema.validateAsync({ nickname });
    //     console.log('ㅇㅇ')
    // }
    // catch (err) {
    //     return res.status(400).send({
    //         errorMesseage: '에러입니다.'
    //     });
    // }
    
    // joi 사용 닉네임 특수문자 글자수 검사
    const result = schema.validate({nickname}) 
    if (result.error) return res.status(400).send({ errorMesseage: '닉네임은 최소 영문 및 숫자 3자이상 특수문자 미포함입니다.'});


    // 회원가입
    const user = new User({ email, nickname, password });
    await user.save();

    res.status(201).send({});
});

// 로그인
router.post("/auth", async (req, res) => {
    const { nickname, password } = req.body;

    const user = await User.findOne({ nickname, password }).exec();

    if (!user) {
        res.status(400).send({
        errorMessage: '닉네임 또는 패스워드를 확인해주세요.',
    });
    return;
    }
//시크릿키는 따로입력
// 로그인
    const token = jwt.sign({ userId: user.userId}, "my-secret-key");
    res.send({
        token,
    });
});

// 내정보 조회
// router.get("/users/me", authMiddleware, async (req, res) => {
//     const { user } = res.locals;

//     res.send({
//         user: {
//             nickname: user.nickname,
//             password: user.password,
//         }
//     }); 
// });
////////////////////////////

// 게시글 조회 페이지
router.get("/article", async (req, res) => {
    try {
      const { borderDate } = req.query;
      const article = await Articles.find({}, {authorId:1, title:1, nickname:1, borderDate:1}).sort({ borderDate:-1 });
      res.json({ article });
    } catch (err) {
      console.error(err);
      return res.status(404)
    }
  });
  
  // 상세 조회
  router.get("/article/:authorId", async (req, res) => {
    const { authorId } = req.params;
  
    const [ detail ] = await Articles.find({ authorId }, { authorId:1, title:1, nickname:1});
    res.json({
      detail,
    });
  });
  
  
  // 게시글 생성
  // authMiddleware // const { user } = res.locals;
  router.post("/article", authMiddleware, async (req, res) => {
    const { authorId, title } = req.body;
    const { user } = res.locals;
    // console.log(user)
    try {
      const article = await Articles.find({ authorId });
      if (!article.length) {
        await Articles.create({ authorId, title, nickname:user.nickname })
      }
      res.send ( article );
    } catch (err) {
      console.log(err)
      return res.status(404)
    }
  }); 
  
  
  // 삭제 페이지
  router.delete("/article/:authorId", authMiddleware, async (req, res) => {
      try {
      const { user } = res.locals;
      const { authorId } = req.params;
      const [article] = await Articles.find({ authorId });
      console.log(article)
      if (!article) {
        return res.send({ result: "게시물이 없습니다."})
      }
      if (article.nickname !== user.nickname ) {
        return res.send({ result: "작성자가 아닙니다" });
      }
      await Articles.deleteOne({ authorId });
      res.send ({ result: "삭제 완료" })
      } catch (err) {
      console.log(err)
      return res.status(404)
      }
  });
  

  // 수정 페이지
  router.patch("/article/:authorId", authMiddleware, async (req, res) => {
    try {
    const { authorId } = req.params;
    const { user } = res.locals;
    const { title } = req.body;

    const [article] = await Articles.find({ authorId });
    if (!article) {
      return res.send({ result: "게시물이 없습니다."})
    }
    if (article.nickname !== user.nickname ) {
      return res.send({ result: "작성자가 아닙니다" });
    }
    await Articles.updateOne({ authorId }, { $set: { title } });
    res.send({ result: "수정 완료" });
    } catch (err) {
    console.log(err)
    return res.status(404)
    }
  })


  //////
  // 댓글 생성 
  router.post("/article/:authorId/comment", authMiddleware, async (req, res) => {
    try {
    const { authorId } = req.params;
    const { user } = res.locals;
    const { comment, commentId } = req.body;
    console.log(user)

    if (!comment) {
      return res.send({ result: "댓글 내용을 입력해주세요"});
    }
    const [article] = await Articles.find({ authorId });
    if (article) {
      await Comment.create({ nickname:user.nickname, comment, commentId })
      return res.send({ result: "댓글 작성."})
    }
    } catch (err) {
      console.log(err)
      return res.status(404)
    }
  });

  // 댓글 목록 조회
  router.get("/comment", async (req, res) => {
    try {
      const comment = await Comment.find({}, {nickname:1, borderDate:1, comment:1}).sort({ borderDate:-1 });
      res.json({ comment });
    } catch (err) {
      console.error(err);
      return res.status(404)
    }
  });

  // 댓글 수정
  router.patch("/comment/:commentId", authMiddleware, async (req, res) => {
    try {
    const { commentId } = req.params;
    const { user } = res.locals;
    const { comment } = req.body;

    const [comments] = await Comment.find({ commentId });
    if (comments.nickname !== user.nickname ) {
      return res.send({ result: "작성자가 아닙니다" });
    }
    if (comments.nickname === user.nickname)
    await Comment.updateOne({ commentId }, { $set: { comment } });
    res.send({ result: "수정 완료" });
    } catch (err) {
      console.error(err);
      return res.status(404)
    }
  })

    // 댓글 삭제
    router.delete("/comment/:commentId", authMiddleware, async (req, res) => {
      try {
      const { commentId } = req.params;
      const { user } = res.locals;

      const [comments] = await Comment.find({ commentId });
      if (comments.nickname !== user.nickname) {
        return res.send({ result: "작성자가 아닙니다" });
      }
      if (comments.nickname === user.nickname) 
        await Comment.deleteOne({ commentId });
        res.send({ rseult: "삭제 완료"})
    } 
      catch (err) {
        console.error(err);
        return res.status(404)
      }
  })





  module.exports = router;


  
app.listen(3000, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});


