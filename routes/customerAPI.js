const express = require('express');
const router = express.Router();
const { db } = require('../firebase.js')
const bcrypt = require('bcrypt');
const saltRounds = 10; // 設定鹽  ( 8/10/12/14比較常見 )

// 測試頁
router.get('/', async (req, res) => {
  res.send({ msg: '這是/customer' })
})

// 測試取ID用的---------------
router.get('/test', async (req, res) => {
  try {
    const newArr = [];
    const getId = await db.collection('bulb-customer').get();
    getId.forEach((item) => {
      newArr.push({ id: item.id, ...item.data() })
      console.log('=====我是分隔線=====');
      console.log('@@@@', newArr);
    })
  } catch (e) {
    console.log(e);
  }
  res.send({ msg: '這是測試取id頁' })
})

// 註冊(改) ///////////////////////////////////
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = await req.body;
    // 檢查有無重複email、 第一次處理寫入------------------
    const checkAccount = await db.collection('bulb-customer').get();
    const result = [];
    checkAccount.forEach((item) => {
      result.push(item.data().email)
    });
    if (result.some((item) => item === email)) {
      res.send({ msg: '此email已存在', success: false })
    } else {
      const hashValue = await bcrypt.hash(password, saltRounds) // 密碼先bcrypt加密
      const firstSave = db.collection('bulb-customer').doc(); // 寫入firebase
      await firstSave.set({
        name,
        email,
        password: hashValue,
        address: '',
        tel: '',
        cart: [],
        favorite: [],
      });

      // 第二次處理寫入(寫入firebase ID)--------------------
      const checkAccount2 = await db.collection('bulb-customer').get();
      let fbd_id = '';
      let firstSaveData = {}
      checkAccount2.forEach((item) => {
        if (item.data().email === email) {
          fbd_id = item.id;
          firstSaveData = item.data();
        }
      });
      const secondSave = db.collection('bulb-customer').doc(fbd_id);
      secondSave.set({
        fbd_id,
        ...firstSaveData
      })
      res.send({ msg: '註冊成功', success: true });

    }
  } catch (e) {
    res.send(e)
  }
})

// 登入 ////////////////////////////////////
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // 確認帳號是否存在
    const checkEmail = await db.collection('bulb-customer').get();
    const result = [];
    checkEmail.forEach((item) => {
      result.push(item.data())
    })

    if (result.some(item => item.email === email)) {
      // 比對密碼 如果正確將資料寫入session 並告知登入成功
      const i = result.findIndex((item) => item.email === email)
      let checkPassword = await bcrypt.compare(password, result[i].password)

      if (checkPassword) {
        req.session.isVerified = true;
        // req.session.email = result[i].email
        // req.session.name = result[i].name
        // req.session.address = result[i].address
        // req.session.tel = result[i].tel
        req.session.fbd_id = result[i].fbd_id
        res.send({
          msg: '登入成功',
          success: true,
          user: req.session.fbd_id
        })
      } else {
        res.send({
          msg: '登入失敗 請確認密碼是否正確',
          success: false
        })
      }
    } else {
      res.send({ msg: '帳號不存在', success: false })
    }
  } catch (e) {
    res.send(e)
  }
})

// 登出 ////////////////////////////////////
router.post('/logout', (req, res) => {
  // req.session.isVerified = false;
  req.session.destroy();
  res.send({ msg: '登出成功' })
})


// middlewware //////////////////////////////
const verifyUser = (req, res, next) => {
  if (req.session.isVerified) {
    next()
  } else {
    res.send({
      msg: '尚未登入',
      isLogin: false
    })
  }
}

// 驗證是否登入狀態 /////////////////////////////////////
router.post('/verify', verifyUser, (req, res) => {
  res.send({
    msg: '目前是登入狀態',
    isLogin: true,
    user: req.session.fbd_id
  })
})

// get個人資料 ////////////////////////////////////////////
router.get('/user/:id', verifyUser, async (req, res) => {
  if (req.params.id === req.session.fbd_id) {
    const userId = req.params.id;
    const userData = db.collection('bulb-customer').doc(userId);
    const result = await userData.get();
    const { name, email, address, tel } = result.data();
    res.send({
      name,
      email,
      address,
      tel
    })
  } else {
    res.send({
      msg: '頁面不存在'
    })
  }
})


// 更新資料 //////////////////////////////////////
router.put('/user/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, email, address, tel } = req.body;
  const newData = db.collection('bulb-customer').doc(userId);
  await newData.update({ name, email, address, tel });
  res.send({ msg: '更新成功' })
})

// =================↓↓↓ 購物車 / 收藏清單 ↓↓↓========================

// 加入(更新)購物車 //////////////////////////////////////
router.post('/cart/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const addCart = db.collection('bulb-customer').doc(userId);
    await addCart.update({ cart: req.body });
    res.send({ msg: '購物車已經更新', cart: req.body })
  } catch (e) {
    console.log(e);
    res.status(404).send({ msg: '似乎有些問題', success: false })
  }
})

// 取得購物車 //////////////////////////////////////
router.get('/cart/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = db.collection('bulb-customer').doc(userId);
    const result = await userData.get();
    res.send({ msg: '成功取得購物車', cart: result.data().cart, success: true })
  } catch (e) {
    res.status(404).send({ msg: '似乎有些問題', success: false })
  }
})


// 更新收藏清單 ////////////////////////////////////
router.post('/favorite/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const addFavorite = db.collection('bulb-customer').doc(userId);
    await addFavorite.update({ favorite: req.body });
    res.send({ msg: '收藏清單已更新', success: true })
  } catch (e) {
    console.log(e);
    res.status(404).send({ msg: '似乎有些問題', success: false })
  }
})

// 取得收藏清單 ////////////////////////////////////
router.get('/favorite/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = db.collection('bulb-customer').doc(userId);
    const result = await userData.get();
    res.send({ msg: '成功取得收藏清單', favorite: result.data().favorite, success: true })
  } catch (e) {
    res.status(404).send({ msg: '似乎有些問題', success: false })
  }
})

// 取得購買紀錄
router.get('/history/:id', verifyUser, async (req, res) => {
  try {
    const newArr = [];
    // 取出資料使用排序
    const getHistory = await db.collection("bulb-order").orderBy("date", "desc").get();
    getHistory.forEach((item) => {
      if (item.data().user_id === req.params.id) {
        newArr.push(item.data());
      }
    })
    res.send({ msg: '取得訂單資料', order: newArr })
  } catch (e) {
    console.log(e);
  }
})

module.exports = router;
