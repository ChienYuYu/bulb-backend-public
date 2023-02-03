const express = require('express');
const router = express.Router();
const { db } = require('../firebase.js')
const { nanoid } = require('nanoid');

// // 存入訂單
// router.post('/', async(req, res) => {
//   console.log(req.body.user_id);
//   try{
//     const newOrder = db.collection('bulb-order').doc();
//     newOrder.set(req.body)
//     res.send({msg: '訂單已新增', success: true});
//   } catch(e) {
//     console.log(e);
//   }
// })


// 存入訂單(新增個d_id當唯一值 幫助識別用)
router.post('/', async(req, res) => {
  console.log(req.body.user_id);
  try{
    const newOrder = db.collection('bulb-order').doc();
    newOrder.set({ ...req.body, d_id: nanoid() })
    res.send({msg: '訂單已新增', success: true});
  } catch(e) {
    console.log(e);
  }
})


module.exports = router;