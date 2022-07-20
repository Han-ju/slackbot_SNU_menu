function update(date) {
  Logger.log("try update");
  if(!date){
    var today = new Date();
    today.setHours(today.getHours()+14);
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'+'+today.getDate();
  }
  Logger.log(date);
  var sheet = SpreadsheetApp.getActiveSheet();

  sheet.getRange(1, 1).setValue(date)

  var html = UrlFetchApp.fetch("https://snuco.snu.ac.kr/foodmenu").getContentText();
  var regex_a = / +<tr  class="[^"]+">\n *<td  class="views-field views-field-field-restaurant">\n *([^ ]*?)(?:\(\d+-\d+\))? *<\/td>([\s\S]+?)(?=<\/tr>)/g;
  var regex_b = / +<td  class="views-field views-field-field-(breakfast|lunch|dinner)">\n *(?:<p>|<div>)([\s\S]+?)(?=<\/td>|<p><span|<p style)/g

  var index = 2;
  var block;
  while (block = regex_a.exec(html)) {
    sheet.getRange(index, 1).setValue(block[1]);
    var time_menu;
    while (time_menu = regex_b.exec(block[2])) {
      var col = ['1 start', 'restaurant', 'breakfast', 'lunch', 'dinner'].indexOf(time_menu[1]);
      var extracts = time_menu[2].replaceAll(/<[\s\S]+?>/g, '').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
      if (block[1] == '두레미담')
        extracts = /([\s\S]+?)<주문식 메뉴>[\s\S]*/g.exec(extracts)[1]
      if (extracts.includes("운영시간"))
        extracts = /([\s\S]+?)※ ?운영시간[\s\S]*/g.exec(extracts)[1]
      sheet.getRange(index, col).setValue(extracts.trim());
    }
    index++;
  }
  sheet.getRange(1, 2).setValue(index);
  Logger.log("update success");
}

function getParameterByName(name, str) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(str);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


function doPost(e) {
  var today = new Date();
  today.setHours(today.getHours()+14);
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'+'+today.getDate();
  var sheet = SpreadsheetApp.getActiveSheet();
  
  if(sheet.getRange(1, 1).getValue() != date){
    update(date)
  }
  
  var time;
  // 9 ~ 32 : 7 <= t < 9 breakfast / 9 <= t < 13 lunch / 13 <= t < 19 dinner
  if(today.getHours() < 9){
    time = 2;
  } else if(today.getHours() < 13){
    time = 3;
  } else {
    time = 4;
  }

  var selection;
  try {
    selection = getParameterByName("text", e.postData.contents);
  } catch(e) {
    selection = '모두';
  }
  Logger.log(selection);
  sheet.getRange(1, 3).setValue(selection);
  if(['농식', '농', '3식', '삼식', '농대', '농대식당','전망대', '전망대식당', '전식'].includes(selection)){
    selection = '3식당';
  } else if(['학', '학관', '학식', '1식', '천식', '학생식당','학생회관', '학생회관식당', '학관식당', '학관식'].includes(selection)){
    selection = '학생회관식당';
  } else if(['자하연', '자', '자하연식당', '자식'].includes(selection)){
    selection = '자하연식당';
  } else if(['두레', '두레미담', '두래', '두래미담', '두식', '농협', '뷔폐', '뷔페', '부페'].includes(selection)){
    selection = '두레미담';
  } else if(['모두', 'every', ''].includes(selection)){
      var msg = (today.getMonth()+1)+'월 '+today.getDate() + '일의 ' + ['아침', '점심', '저녁'][time - 2] + ' 메뉴입니다.\n';
      for (var i = 1 ; i < sheet.getRange(1, 2).getValue() ; i++) {
        
        if(['3식당', '두레미담', '학생회관식당', '자하연식당'].includes(sheet.getRange(i, 1).getValue())){
          var msg = msg + sheet.getRange(i, 1).getValue() + '\n```' + sheet.getRange(i, time).getValue() + '```\n';
        }
      }
      Logger.log(msg)
      return ContentService.createTextOutput(msg);
  
  } else {
    return ContentService.createTextOutput("[도저히 예측하지 못한 식당 이름입니다. 조금 더 보편적인 식당 이름으로 검색해주세요.]")
  }

  for (var i = 1 ; i < sheet.getRange(1, 2).getValue() ; i++) {
    if(sheet.getRange(i, 1).getValue() == selection){
      var msg = sheet.getRange(i, 1).getValue() + '\n```' + sheet.getRange(i, time).getValue() + '```';
      //sendmsg(msg);
      Logger.log(msg)
      return ContentService.createTextOutput(msg);
    }
  }
}
