const db = require('../dbs/rdb.js');

function validateURL(input) {
  if (input.length > 255) return false;
  let url;
  try {
    url = new URL(input);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function postReview(data, callback) {
  let {
    product_id,
    rating,
    summary,
    body,
    recommend,
    name,
    email,
    photos,
    characteristics
  } = data;
  summary = db.connection.escape(summary);
  body = db.connection.escape(body);
  name = db.connection.escape(name);
  email = db.connection.escape(email);

  // Validate here
  if (isNaN(product_id)) {
    callback("Product ID not a number", null);
    return;
  }
  if (isNaN(rating) || rating > 5 || rating < 1) {
    callback("Invalid rating", null);
    return;
  }
  if (typeof summary !== 'string'
      || typeof body !== 'string'
      || typeof name !== 'string'
      || typeof email !== 'string') {
    callback("Expected type string", null);
    return;
  }
  if (summary.length > 60) {
    callback("Summary too long", null);
    return;
  }
  if (body.length < 50 || body.length > 1000) {
    callback("Improper body length", null);
    return;
  }
  if (name.length > 60) {
    callback("Name is too long", null);
    return;
  }
  if (email.length > 60 || !email.includes('@')) {
    callback("Invalid email", null);
    return;
  }
  if (photos && !Array.isArray(photos)) {
    callback("Photos are not in an array", null);
    return;
  }
  if (photos.length > 5) {
    callback("TOO MANY PHOTOS", null);
    return;
  }
  if (typeof characteristics !== 'object') {
    callback("Invalid characteristics", null);
    return;
  }

  const charCheckQuery = `
    SELECT id
    FROM characteristics
    WHERE product_id = ${product_id};
  `;

  db.connection.query(charCheckQuery, (err, charResult) => {
    if (err) {
      callback(err, null);
    } else {
      const char_ids = Object.keys(characteristics);
      if (charResult.length !== char_ids.length) {
        callback("Invalid characteristic(s)", null);
      }
      for (let i = 0; i < charResult.length; i++) {
        if (!char_ids.includes(charResult[i].id.toString())) {
          callback("Invalid characteristic(s)", null);
          return;
        }
      }
      const reviewQuery = `
        INSERT INTO reviews (
          product_id,
          rating,
          r_date,
          summary,
          body,
          recommend,
          reported,
          reviewer_name,
          reviewer_email,
          helpfulness
        ) VALUES (
          ${product_id},
          ${rating},
          "${new Date().toISOString().slice(0, 19).replace('T', ' ')}",
          "${summary}",
          "${body}",
          ${recommend},
          ${false},
          "${name}",
          "${email}",
          ${0}
        );
      `;

      db.connection.query(reviewQuery, (err, result) => {
        if (err) {
          callback(err, null);
        } else {
          // result.insertId
          let photoQuery = `
            INSERT INTO photos (
            review_id,
            url
          ) VALUES `;
          for (let i = 0; i < photos.length; i++) {
            if (!validateURL(photos[i])) {
              callback("Invalid photo URL(s) supplied", null);
              return;
            }
            photoQuery += `(
              ${result.insertId},
              ${photos[i]}
              )`;
            if (i < photo.length - 1) {
              photoQuery += ', ';
            }
          }
          photoQuery += ';';

          let charQuery = `INSERT INTO review_characteristics (
            characteristic_id,
            review_id,
            rating
          ) VALUES `;
          for (let i = 0; i < char_ids.length; i++) {
            charQuery += `(
                ${char_ids[i]},
                ${result.insertId},
                ${characteristics[char_ids[i]]}
              )`;
            if (i < char_ids.length - 1) {
              charQuery += ', ';
            }
          }
          charQuery += ';';

          let photoPromise;
          let charPromise;
          if (photos.length) {
            photoPromise = new Promise((resolve, reject) => {
              db.connection.query(photoQuery, (photoError, photoResults) => {
                if (photoError) {
                  return reject(photoError);
                } else {
                  return resolve(photoResults);
                }
              });
            });
          }
          if (char_ids.length) {
            charPromise = new Promise((resolve, reject) => {
              db.connection.query(charQuery, (charError, charResults) => {
                if (charError) {
                  return reject(charError);
                } else {
                  return resolve(charResults);
                }
              });
            });
          }

          console.log(charQuery);
          Promise.all([photoPromise, charPromise])
            .then(results => callback(null, results))
            .catch(finalError => callback(finalError, null));
        }
      });
    }
  });
}

module.exports.postReview = postReview;