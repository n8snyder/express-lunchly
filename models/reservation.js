"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** Get reservation Id */
  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE id = $1`,
      [id],
    );
    if (results.rows[0] === undefined) {
      const err = new Error(`No such reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(results.rows[0]);
  }

  /** Function to save updates or create new reservation */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
                num_guests=$1,
                start_at=$2,
                notes=$3
             WHERE id = $4`, [
        this.numGuests,
        this.startAt,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** Function to retrieve notes value */

  get notes() {
    return this._notes;
  }

  /** function to set ensure notes value is not falsy */

  set notes(val) {
    if (!val) {
      this._notes = "";
    } else {
      this._notes = val;
    }
  }

  /** Getter for numGuests */

  get numGuests() {
    return this._numGuests;
  }

  /** Setter for numGuests. Can't be below 1. */

  set numGuests(num) {
    if (+num < 1) {
      throw new RangeError("Guests must be 1 or more.");
    }
    this._numGuests = num;
  }

  /** Getter for startAt */

  get startAt() {
    return this._startAt;
  }

  /** Setter for startAt */

  set startAt(date) {
    if (date.toString() === "Invalid Date") {
      throw new TypeError("Not a Date type.");
    }
    this._startAt = new Date(date);
  }

  /** Getter for customerId */

  get customerId() {
    return this._customerId;
  }

  /** Setter for customerId */

  set customerId(val) {
    if (this.customerId === undefined) {
      this._customerId = val;
    } else {
      throw new Error("CustomerId cannot be reassigned.");
    }
  }

}


module.exports = Reservation;
