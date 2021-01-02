

//Login Functionality
const assert = require('assert');
const sqlite3 = require('sqlite3').verbose();

/**
 * Requirements:
 *
 * If a user enters three wrong passwords consecutively 3 times, then BLOCK the USER. Reset in 1 hour
 * If a user enters three wrong passwords within a sliding  time frame of 30 mins, BLOCK the USER.
 *
 * */





const SLIDING_WINDOW_MINS = 30;

class LoginResponeEnum {

  static get SUCCESS() {
    return "SUCCESS";
  }

  static get FAIL() {
    return "FAIL";
  }

  static get BLOCKED() {
    return "BLOCKED";
  }

  static get values() {
    return [this.SUCCESS, this.FAIL, this.BLOCKED];
  }

}


class LoginSimulation {
  
  constructor() {
    // init some stuff
   
    let db;
    
    this.bootstrapUsers()
    
  }

 

  

  

  

   bootstrapUsers() {
     // 
      //create some users in the in memory database simulation

      this.db =   new sqlite3.Database(':memory:', (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the in-memory SQlite database.');
    });
   
    let sql = "CREATE TABLE Users (username varchar(255) NOT NULL,password varchar(255) NOT NULL,last_login_date DATETIME,status varchar(255) NOT NULL,attempts int NOT NULL,PRIMARY KEY(username))"

     this.db.run(sql,(err)=>{
      console.log("from here",err)
    })
   
    const Users = [
                    {username:"USER 1",password:"right pass"},
                    {username:"USER 2",password:"right pass"},
                    {username:"USER 3",password:"right pass"},
                    {username:"USER 4",password:"right pass"},
                    ]
    Users.map((user) =>{

      

      this.db.run(`INSERT INTO Users (username, password, last_login_date, status,attempts)
        VALUES (?, ?, ?, ?,?)`,
      [user.username, user.password, new Date(), "UNBLOCKED",0],(err)=>{
        console.log("from"+err)
      })
    })
    
  


  }

  UnBlock(username){
    setTimeout((username)=>{
      this.updateDB(new Date(),"UNBLOCKED",0,username)
    },3600*1000)
  }

  updateTable(last_login_date,status,attempts,username){

    this.db.run( `UPDATE projects
             SET last_login_date = ?,
                 status = ? ,
                 attempts = ?  WHERE username = ?`,
      [last_login_date,status,attempts, row.username])
  }

  doLogin(username, password, date = new Date()) {
      // //
      
      let sql = `SELECT * FROM Users WHERE username = ?`;
      this.db.get(sql, [username], (err, row) => {
        if (err) {
        return console.error(err.message);
        }
        else {
          if(row){

            if(row.status == "BLOCKED"){
              return LoginResponeEnum.BLOCKED
            }


            else if(row.password == password && row.attempts <3 && row.status == "UNBLOCKED"){
              this.updateDB(date,"UNBLOCKED",0,row.username)
              return LoginResponeEnum.SUCCESS
            }

            else if(row.password != password && row.attempts <=3 && row.status == "UNBLOCKED"){
              if(this.checkTime(date,row.last_login_date)){
                if(row.attempts +1 >=3){
                  this.updateDB(row.last_login_date,"BLOCKED",3,row.username)
                  return LoginResponeEnum.BLOCKED
                }
                else{
                  
                  this.updateDB(row.last_login_date,"UNBLOCKED",row.attempts +1,row.username)
                  return LoginResponeEnum.FAIL
                }
              }
              else{
                if(row.attempts +1 >=3){
                  this.updateDB(date,"BLOCKED",3,row.username)
                  this.UnBlock(date,row.username)
                  return LoginResponeEnum.BLOCKED
                }
                else{
                  
                  this.updateDB(date,"UNBLOCKED",row.attempts +1,row.username)
                  return LoginResponeEnum.FAIL
                }
              }


            }

          }
        }

  });
   
}

  inMins(mins) {
    return new Date(+new Date() + mins * 60 * 1000);
  }

  checkTime(currentdate,last_login_date){
      
      return ((new Date( currentdate-last_login_date).getHours()*60 + new Date( currentdate-last_login_date).getMInutes())<=30 ) 
  }

  // for testing
  testThreeConsiquitiveFailures() {
    console.log("Testing Three Consequitive wrong passwords");
    assert.equal(this.doLogin("user 1", "wrong pass"), LoginResponeEnum.FAIL);
    assert.equal(this.doLogin("user 1", "wrong pass", this.inMins(20)), LoginResponeEnum.FAIL);
    assert.equal(this.doLogin("user 1", "wrong pass", this.inMins(25)), LoginResponeEnum.BLOCKED);
    assert.equal(this.doLogin("user 1", "wrong pass", this.inMins(40)), LoginResponeEnum.BLOCKED);
    assert.equal(this.doLogin("user 1", "wrong pass", this.inMins(60)), LoginResponeEnum.BLOCKED);
    assert.equal(this.doLogin("user 1", "right pass", this.inMins(60)), LoginResponeEnum.BLOCKED);
    assert.equal(this.doLogin("user 1", "wrong pass", this.inMins(150)), LoginResponeEnum.FAIL);
  }

  testUserIsBlockedInSlidingTimeFrame() {
    console.log("Testing user is blocked in sliding timeframe");
    assert.equal(this.doLogin("user 1", "wrong pass"), LoginResponeEnum.FAIL);
    assert.equal(this.doLogin("user 1", "right pass", this.inMins(5)), LoginResponeEnum.SUCCESS);
    assert.equal(this.doLogin("user 1", "right pass", this.inMins(8)), LoginResponeEnum.SUCCESS);
    assert.equal(this.doLogin("user 1", "wrong pass", this.inMins(20)), LoginResponeEnum.FAIL);
    assert.equal(this.doLogin("user 1", "wrong pass", this.inMins(31)), LoginResponeEnum.FAIL);
    assert.equal(this.doLogin("user 1", "right pass", this.inMins(40)), LoginResponeEnum.SUCCESS);
    assert.equal(this.doLogin("user 1", "wrong pass", this.inMins(44)), LoginResponeEnum.BLOCKED);
    assert.equal(this.doLogin("user 1", "right pass", this.inMins(45)), LoginResponeEnum.BLOCKED);
    assert.equal(this.doLogin("user 1", "right pass", this.inMins(110)), LoginResponeEnum.SUCCESS);
  }

}

// Test condition 1
let n = new LoginSimulation()
 setTimeout(()=>{console.log("Timeout3")},10000)
n.testThreeConsiquitiveFailures()
// test condition 2
new LoginSimulation().testUserIsBlockedInSlidingTimeFrame();
