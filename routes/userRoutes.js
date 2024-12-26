const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { checkJwt } = require("../config/auth");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

router.get("/data", checkJwt, async (req, res) => {
  try {
    const response = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/userinfo`,
      {
        headers: {
          authorization: req.headers.authorization,
        },
      }
    );
    const auth0Data = await response.json();

    const dbResult = await pool.query(
      "SELECT * FROM user_profiles WHERE auth0_id = $1",
      [auth0Data.sub]
    );

    if (dbResult.rows.length === 0) {
      await pool.query(
        "INSERT INTO user_profiles (auth0_id, name, email, picture) VALUES ($1, $2, $3, $4)",
        [auth0Data.sub, auth0Data.name, auth0Data.email, auth0Data.picture]
      );
    }

    res.json({
      message: "Profile data retrieved successfully",
      user: {
        ...auth0Data,
        ...dbResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Error in GET /api/data:", error);
    res.status(500).json({
      message: "Error retrieving profile data",
      error: error.message,
    });
  }
});

router.put("/data", checkJwt, async (req, res) => {
  try {
    const { sub } = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/userinfo`,
      {
        headers: {
          authorization: req.headers.authorization,
        },
      }
    ).then((res) => res.json());

    const { name, email } = req.body;

    // First update the database
    const result = await pool.query(
      `UPDATE user_profiles 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email)
       WHERE auth0_id = $3
       RETURNING *`,
      [name, email, sub]
    );

    // Check if the update affected any rows
    if (result.rows.length === 0) {
      // If no rows were updated, try to insert the user
      const insertResult = await pool.query(
        "INSERT INTO user_profiles (auth0_id, name, email) VALUES ($1, $2, $3) RETURNING *",
        [sub, name, email]
      );

      return res.json({
        message: "Profile created successfully",
        user: {
          ...insertResult.rows[0],
          sub: sub,
        },
      });
    }

    // If update was successful, return the updated data
    res.json({
      message: "Profile updated successfully",
      user: {
        ...result.rows[0],
        sub: sub,
      },
    });
  } catch (error) {
    console.error("Error in PUT /api/data:", error);
    res.status(500).json({
      message: "Error updating profile",
      error: error.message,
    });
  }
});

module.exports = router;
