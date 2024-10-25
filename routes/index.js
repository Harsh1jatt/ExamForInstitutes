const express = require('express')
const router = express.Router();



router.get('/', function(req, res){
    res.render('login')
})
router.get('/institute-login', function(req, res){
    res.render('instituteLogin')
})
router.get('/owner-login', function(req, res){
    res.render('ownerLogin')
})
router.get('/select-exam', function(req, res){
    res.render('examSelection')
})
router.get('/all-question', function(req, res){
    res.render('allQuestions')
})
router.get('/manage-exam', function(req, res){
    res.render('manageExam')
})
router.get('/manage-students', function(req, res){
    res.render('manageStudents')
})
router.get('/rules', function(req, res){
    res.render('rules')
})
router.get('/typing', function(req, res){
    res.render('typing')
})
router.get('/create-exam', function(req, res){
    res.render('create-exam')
})
router.get('/create-institute', function(req, res){
    res.render('create-institute')
})
router.get('/admin-dashboard', function(req, res){
    res.render('adminDashboard')
})


module.exports = router;