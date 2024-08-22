import User from "../models/User.js";

export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};
export const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted.");
  } catch (err) {
    next(err);
  }
};
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.userId);
    const { password, ...userWithoutPassword } = user._doc;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    if (error.name === "CastError") {
      console.log(
        `user.controller, getUserById. User not found with id: ${req.userId}`
      );
      return res.status(404).json({ message: "User not found" });
    }
    console.log(
      `user.controller, getUserById. Error while getting user with id: ${req.userId}`,
      error.name
    );
    res.status(500).json({ message: error.mesagge });
  }
}
