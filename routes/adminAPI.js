const express = require('express');
const router = express.Router();
const { db } = require('../firebase.js')
const bcrypt = require('bcrypt');
const saltRounds = 10; // 設定鹽  ( 8/10/12/14比較常見 )

// 測試頁
router.get('/', async (req, res) => {
  res.send({ msg: '這是/admin' })
})


// 註冊(先註解掉 要註冊才打開) ///////////////////////////////////
// router.post('/register', async (req, res) => {
//   try {
//     const { account, password, name } = await req.body;
//     // 檢查有無重複email、 第一次處理寫入------------------
//     const checkAccount = await db.collection('bulb-administrator').get();
//     const result = [];
//     checkAccount.forEach((item) => {
//       result.push(item.data().account)
//     });
//     if (result.some((item) => item === account)) {
//       res.send({ msg: '此帳號已存在', success: false })
//     } else {
//       const hashValue = await bcrypt.hash(password, saltRounds) // 密碼先bcrypt加密
//       const firstSave = db.collection('bulb-administrator').doc(); // 寫入firebase
//       await firstSave.set({
//         name,
//         account,
//         password: hashValue,
//       });

//       // 第二次處理寫入(寫入firebase ID)--------------------
//       const checkAccount2 = await db.collection('bulb-administrator').get();
//       let fbd_id = '';
//       let firstSaveData = {}
//       checkAccount2.forEach((item) => {
//         if (item.data().account === account) {
//           fbd_id = item.id;
//           firstSaveData = item.data();
//         }
//       });
//       const secondSave = db.collection('bulb-administrator').doc(fbd_id);
//       secondSave.set({
//         fbd_id,
//         ...firstSaveData
//       })
//       res.send({ msg: '註冊成功', success: true });

//     }
//   } catch (e) {
//     res.send(e)
//   }
// })

// 登入 ///////////////////////////////////////////////////////
router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    // 確認帳號是否存在
    const checkAccount = await db.collection('bulb-administrator').get();
    const result = [];
    checkAccount.forEach((item) => {
      result.push(item.data())
    })

    if (result.some(item => item.account === account)) {
      // 比對密碼 如果正確將資料寫入session 並告知登入成功
      const i = result.findIndex((item) => item.account === account)
      let checkPassword = await bcrypt.compare(password, result[i].password)

      if (checkPassword) {
        req.session.isVerified = true;
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

// 登出 ////////////////////////////////////////////////
router.post('/logout', (req, res) => {
  // req.session.isVerified = false;
  req.session.destroy();
  res.send({ msg: '登出成功', success: true })
})

// 驗證是否登入狀態 /////////////////////////////////////
router.post('/verify', (req, res) => {
  if (req.session.isVerified) {
    res.send({
      msg: '目前是登入狀態',
      isLogin: true,
      user: req.session.fbd_id
    })
  } else {
    res.send({
      msg: '尚未登入',
      isLogin: false
    })
  }
})

// //////// middlewware ///////////////////
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

// 取得所有訂單
router.get('/order', verifyUser, async (req, res) => {
  const newArr = [];
  const getOrder = await db.collection('bulb-order').orderBy("date", "desc").get();
  getOrder.forEach((item) => {
    newArr.push(item.data());
  })
  res.send({ msg: '取得訂單資料', order: newArr })
})

// 刪除訂單
router.delete('/order/:id', async (req, res) => {
  let orderId = '';
  const findOrder = await db.collection('bulb-order').get();
  findOrder.forEach((item) => {
    if (item.data().d_id === req.params.id) {
      orderId = item.id
    }
  });
  db.collection('bulb-order').doc(orderId).delete();
  res.send({ msg: '刪除成功', success: true })
})


module.exports = router;