const Doctor = require("../models/Doctor");
const { validationResult } = require("express-validator");
const dayjs = require("dayjs");
var customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

exports.createDoctor = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { departmentId, userId } = req.body;

    const doctorFields = {};

    doctorFields.department = departmentId;
    doctorFields.user = userId;

    Doctor.findOne({ user: userId }).then((doctor) => {
      if (doctor) {
        Doctor.findOneAndUpdate(
          { user: userId },
          { $set: doctorFields },
          { new: true }
        ).then((doctor) => res.status(200).json(doctor));
      } else {
        new Doctor(doctorFields)
          .save()
          .then((doctor) => res.status(200).json(doctor));
      }
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("server error");
  }
};

exports.getDatesById = async (req, res) => {
  try {
    const { workingDays, unavaliableDates } = await Doctor.getUnavaliableDates(
      req.params.doctor_id
    );
    console.log(new Date("2020-2-28"));
    res
      .status(200)
      .json({ workingDays: workingDays, unavaliableDates: unavaliableDates });
  } catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
};

exports.getTimeScheduleByDate = async (req, res) => {
  try {
    const { schedule, unavaliableTime } = await Doctor.getUnavaliableTime(
      req.params.doctor_id,
      req.params.date
    );
    res.status(200).json({ schedule, unavaliableTime });
  } catch (error) {
    console.error(error);
    res.status(400).send("Server Error");
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .select("department user schedule")
      .populate("department", "name")
      .populate("user", "firstName lastName");
    res.status(200).json(doctors);
  } catch (err) {
    console.error(err);
    res.status(400).json("Server problem");
  }
};

exports.deleteDoctorById = async (req, res) => {
  try {
    const doctors = await Doctor.findByIdAndDelete(req.params.doctor_id);
    res.status(200).json(doctors);
  } catch (err) {
    console.error(err);
    res.status(400).json("Server problem");
  }
};

exports.setDoctorSchedule = async (req, res) => {
  try {
    const { schedule, unavaliableDates } = req.body;

    const doctorId = req.params.doctorId;

    if (!schedule || schedule.length <= 0) {
      return res
        .status(400)
        .json({ errors: ["Seems you did not set any schedule"] });
    }

    const doctor = await Doctor.findOne({ _id: doctorId });

    if (!doctor ) {
      return res
        .status(400)
        .json({ errors: ["There is no doctor with this id"] });
    }

    if ((req.user.role!=='admin')&&!(String(doctor.user._id)===String(req.user._id)) ) {
      return res
        .status(403)
        .json({ errors: ["You don't have enough permission to do that!"] });
    }

    // Schedule validation
    for (let i = 0; i < schedule.length; i++) {
      // Checks if starting hour has a valid format 00:00 23:59
      if (
        !/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(
          schedule[i].start
        )
      ) {
        return res
          .status(400)
          .json({ errors: [schedule[i].start + " is not a valid time"] });
      }

      // Checks if ending hour has a valid format 00:00 23:59
      if (
        !/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(
          schedule[i].end
        )
      ) {
        return res
          .status(400)
          .json({ errors: [schedule[i].end + " is not a valid time"] });
      }


      if(schedule[i].start>schedule[i].end){
        return res
          .status(400)
          .json({ errors: ["Starting time in the schedule has to be earlier than ending hour!"] });
      }
    }

    // Checking if unavaliable dates has a valid format
    for (let i = 0; i < unavaliableDates.length; i++) {
      if (
        !dayjs(unavaliableDates[i], ["DD-MM-YYY", "YYYY-MM-DD"], true).isValid()
      ) {
        return res
          .status(400)
          .json({ errors: [unavaliableDates[i] + " is not a valid date"] });
      }
    }
    doctor.schedule=schedule;
    doctor.unavaliableDates=unavaliableDates;
    const result = await doctor.save();
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
};
