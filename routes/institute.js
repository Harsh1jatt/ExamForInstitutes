const express = require("express");
const router = express.Router();
const instituteModel = require("../models/instituteModel");
const Student = require("../models/studentModel");
const Exam = require("../models/examModel");
const TypingTest = require("../models/typingTestModel");
const Question = require("../models/questionModel");
const authMiddleware = require("../middlewares/auth");
const bcrypt = require("bcrypt");
const upload = require('../config/multer-config')

router.get("/my-institute", authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'institute' && req.institute) {
      res.status(200).json(req.institute); // Send the institute data
    } else {
      res.status(403).json({ error: "Access denied. Not an institute user." });
    }
  } catch (error) {
    console.error("Error fetching institute details:", error);
    res.status(400).json({ error: "Error fetching institute details." });
  }
});


// Route to create and add a student to an institute
router.post("/:instituteId/student", upload.single("image"), async (req, res) => {
  const { instituteId } = req.params;
  const { name, password, rollNumber, dateOfBirth } = req.body;

  // Input validation
  if (!name || !password || !rollNumber || !dateOfBirth) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }

  try {
    // Find the institute by its ID
    const institute = await instituteModel.findById(instituteId);
    if (!institute) {
      return res.status(404).json({ error: "Institute not found" });
    }

    // Check if a student with the same roll number already exists
    const existingStudent = await Student.findOne({ rollNumber, institute: instituteId });
    if (existingStudent) {
      return res.status(400).json({
        error: "Student with this roll number already exists in this institute",
      });
    }

    // Hash the password before saving the student
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the public URL for the uploaded profile image if it exists
    const profileImageUrl = req.file ? req.file.publicUrl : "";

    // Create a new student
    const newStudent = new Student({
      studentName: name,
      password: hashedPassword,
      secCode: password, // Avoid storing plain password if possible
      rollNumber,
      dateOfBirth,
      profileImage: profileImageUrl, // Save the Firebase image URL here
      institute: instituteId,
    });

    // Save the student and update the institute's students array
    await newStudent.save();
    institute.students.push(newStudent._id);
    await institute.save();

    // Respond with the created student and institute (excluding the password)
    res.status(201).json({
      message: "Student created successfully",
      student: {
        id: newStudent._id,
        name: newStudent.studentName,
        rollNumber: newStudent.rollNumber,
        dateOfBirth: newStudent.dateOfBirth,
        profileImage: newStudent.profileImage, // Return the image URL
        institute: newStudent.institute,
      },
      institute: {
        id: institute._id,
        name: institute.name,
        email: institute.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Route to create an exam
router.post("/:instituteId/exam", async (req, res) => {
  const { instituteId } = req.params;
  try {
    // Find the institute by ID
    let institute = await instituteModel.findOne({ _id: instituteId });
    if (!institute) {
      return res.status(404).json({ error: "Institute not found" });
    }

    const { examName, examDescription, duration, maxMarks, passMarks } =
      req.body;

    // Create a new exam
    const newExam = new Exam({
      examName,
      examDescription,
      institute: instituteId,
      createdBy: instituteId,
      duration,
      maxMarks,
      passMarks,
    });
    await newExam.save();

    // Add the new exam to the institute's exams array
    institute.exams.push(newExam._id);

    // Save the updated institute document
    await institute.save();

    res.status(201).json(newExam);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to add a question to an exam
router.post("/:examId/questions", async (req, res) => {
  const { examId } = req.params;
  const { questionText, options, correctAnswer, subfield } = req.body;

  try {
    // Create a new question
    const newQuestion = new Question({
      questionText,
      options,
      correctAnswer,
      subfield,
      exam: examId,
    });

    // Save the new question
    await newQuestion.save();

    // Add the question to the exam's questions array
    const exam = await Exam.findById(examId);
    exam.questions.push(newQuestion._id);
    await exam.save();

    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all students of an institute
router.get("/:instituteId/students", async (req, res) => {
  const { instituteId } = req.params;
  try {
    const students = await Student.find({ institute: instituteId });
    res.status(200).json(students);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all exams of an institute
router.get("/:instituteId/exams", async (req, res) => {
  const { instituteId } = req.params;
  try {
    const exams = await Exam.find({ institute: instituteId }).populate(
      "questions"
    );
    res.status(200).json(exams);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// Get all exams of an exam
router.get("/:examId/questions", async (req, res) => {
  const { examId } = req.params;
  try {
    const questions = await Question.find({ exam: examId });
    res.status(200).json(questions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// update feature

// Edit exam (excluding password updates)
router.post("/:examId/edit-exam", async (req, res) => {
  const { examId } = req.params;
  const { examName, examDescription, duration, maxMarks, passMarks } = req.body;

  try {
    // Prepare an object with only the fields that are present in req.body
    const updateFields = {};
    if (examName !== undefined) updateFields.examName = examName;
    if (examDescription !== undefined) updateFields.examDescription = examDescription;
    if (duration !== undefined) updateFields.duration = duration;
    if (maxMarks !== undefined) updateFields.maxMarks = maxMarks;
    if (passMarks !== undefined) updateFields.passMarks = passMarks;

    // Find and update the exam details with only the specified fields
    const exam = await Exam.findOneAndUpdate(
      { _id: examId },
      updateFields,
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    res.status(200).json({ message: "Exam updated successfully", exam });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/:questionId/edit-question", async (req, res) => {
  const { questionId } = req.params;
  const { questionText, options, correctAnswer, subfield } = req.body;

  try {
    // Prepare an object with only the fields that are present in req.body
    const updateFields = {};
    if (questionText !== undefined) updateFields.questionText = questionText;
    if (options !== undefined) updateFields.options = options;
    if (correctAnswer !== undefined) updateFields.correctAnswer = correctAnswer;
    if (subfield !== undefined) updateFields.subfield = subfield;

    // Find and update the question details with only the specified fields
    const question = await Question.findOneAndUpdate(
      { _id: questionId },
      updateFields,
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res
      .status(200)
      .json({ message: "Question updated successfully", question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:studentId/edit-student", async (req, res) => {
  const { studentId } = req.params;
  const { name, rollNumber, dateOfBirth } = req.body;

  try {
    // Prepare an object with only the fields that are present in req.body
    const updateFields = {};
    if (name !== undefined) updateFields.studentName = name;
    if (rollNumber !== undefined) updateFields.rollNumber = rollNumber;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;

    // Find and update the student details with only the specified fields
    const student = await Student.findOneAndUpdate(
      { _id: studentId },
      updateFields,
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res
      .status(200)
      .json({ message: "Student details updated successfully", student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete Feature




// Delete student and remove reference from institute
router.post("/:studentId/delete-student", async (req, res) => {
    const { studentId } = req.params;
  
    try {
      // Find and remove the student by ID
      let student = await Student.findOneAndDelete({ _id: studentId });
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
  
      // Remove student from the related institute's students array
      await instituteModel.updateOne(
        { _id: student.institute },
        { $pull: { students: studentId } }
      );
  
      res.status(200).json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
// Delete exam and remove reference from institute
router.post("/:examId/delete-exam", async (req, res) => {
  const { examId } = req.params;

  try {
    // Find and remove the exam
    let exam = await Exam.findOneAndDelete(examId);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Remove exam from the related institute's exams array
    await instituteModel.updateOne(
      { _id: exam.institute },
      { $pull: { exams: examId } }
    );

    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete question and remove reference from exam
router.post("/:questionId/delete-question", async (req, res) => {
  const { questionId } = req.params;

  try {
    // Find the question by ID
    let question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Remove the question ID from the related exam's questions array
    await Exam.updateOne(
      { _id: question.exam },
      { $pull: { questions: questionId } }
    );

    // Delete the question from the Question collection
    await Question.findByIdAndDelete(questionId);

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/:examId/delete-all-questions", async (req, res) => {
  const { examId } = req.params;

  try {
    // Find the exam document by ID
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Check if there are any questions associated with this exam
    if (exam.questions.length === 0) {
      return res.status(400).json({ message: "No questions to delete for this exam" });
    }

    // Delete all questions from the Question collection that belong to this exam
    await Question.deleteMany({ _id: { $in: exam.questions } });

    // Clear the questions array in the Exam document
    exam.questions = [];
    await exam.save();

    res.status(200).json({ message: "All questions deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




router.post('/:examid/typing-test/create', authMiddleware, async (req, res) => {
  const { title, passage, duration } = req.body;
  
  try {
    // Create the new Typing Test
    const newTest = new TypingTest({
      exam: req.params.examid,
      title,
      passage,
      duration,
      totalWords: passage.split(' ').length,
    });
    await newTest.save();

    // Update the Exam to include the Typing Test ID
    await Exam.findByIdAndUpdate(
      req.params.examid,
      { $push: { typingTests: newTest._id } }, // Assuming Exam schema has `typingTests` array
      { new: true } // Return the updated document
    );

    // Respond with success
    res.status(201).json({
      message: 'Typing test created successfully',
      test: newTest,
    });
  } catch (error) {
    console.error('Error creating typing test:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:examid/typing-test', async (req, res) => {
  try {
    // Fetch the typing test associated with the given exam ID
    const typingTest = await TypingTest.findOne({ exam: req.params.examid });

    if (!typingTest) {
      return res.status(404).json({ message: 'Typing test not found' });
    }

    // Return the typing test details
    res.status(200).json({
      message: 'Typing test fetched successfully',
      typingTest,
    });
  } catch (error) {
    console.error('Error fetching typing tests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a typing test by ID
router.post('/:testid/edit-typingtest', async (req, res) => {
  try {
    // Extract test ID from params and updated data from the request body
    const { testid } = req.params;
    const updatedData = req.body;

    // Find the typing test by ID and update it
    const typingTest = await TypingTest.findByIdAndUpdate(
      testid,
      updatedData,
      { new: true } // Return the updated document
    );

    // If the typing test doesn't exist, return a 404 response
    if (!typingTest) {
      return res.status(404).json({ message: 'Typing test not found' });
    }

    // Return the updated typing test
    res.status(200).json({
      message: 'Typing test updated successfully',
      typingTest,
    });
  } catch (error) {
    console.error('Error updating typing test:', error);
    res.status(500).json({ error: error.message });
  }
});



// Get Details of a Specific Typing Test
router.get('/typing-test/:testId', async (req, res) => {
  const { testId } = req.params;
  try {
    const typingTest = await TypingTest.findById(testId);
    if (!typingTest) {
      return res.status(404).json({ error: 'Typing test not found' });
    }
    res.status(200).json(typingTest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit a Typing Test (Store Submission in TypingTest Model)
router.post('/typing-test/:testId/submit', authMiddleware, async (req, res) => {
  const { testId } = req.params;
  const { typedText, elapsedTime } = req.body;

  try {
    const typingTest = await TypingTest.findById(testId);
    if (!typingTest) {
      return res.status(404).json({ error: "Typing test not found" });
    }

    const totalWords = typingTest.passage.split(' ').length;
    const typedWords = typedText.split(' ').length;

    // Calculate Accuracy
    const correctWords = typingTest.passage
      .split(' ')
      .filter((word, index) => word === typedText.split(' ')[index]).length;
    const accuracy = (correctWords / totalWords) * 100;

    // Calculate Speed (WPM - Words Per Minute)
    const wordsPerMinute = (typedWords / (elapsedTime / 60)).toFixed(2);

    // Add the result to the typing test's results array
    typingTest.results.push({
      student: req.user.id,
      wpm: wordsPerMinute,
      accuracy: accuracy,
      dateTaken: new Date(),
    });

    await typingTest.save();

    res.status(201).json({
      message: "Typing test submitted successfully",
      result: {
        wpm: wordsPerMinute,
        accuracy: accuracy,
        elapsedTime,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Submissions for a Specific Typing Test
router.get('/typing-test/:testId/submissions', async (req, res) => {
  const { testId } = req.params;
  try {
    const typingTest = await TypingTest.findById(testId).populate("results.student", "studentName rollNumber");
    if (!typingTest) {
      return res.status(404).json({ error: "Typing test not found" });
    }
    res.status(200).json(typingTest.results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a Specific Submission by a Student for a Typing Test
router.get('/typing-test/:testId/submission/:studentId', async (req, res) => {
  const { testId, studentId } = req.params;
  try {
    const typingTest = await TypingTest.findById(testId);
    if (!typingTest) {
      return res.status(404).json({ error: "Typing test not found" });
    }
    const submission = typingTest.results.find(result => result.student.toString() === studentId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.status(200).json(submission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
