function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function generateUserID(){
  const allowedChars = "0123456789"
  const length = 9
  var ret = ""

  for (let i=0;i<length;i++){
    ret += allowedChars.charAt(getRandomInt(length))
  }

  return ret
}

exports.generateUserID = generateUserID()