function updateCountry() {
    // 透過API取得國家資料
    $.ajax({
      type: 'POST',
      url: '/get_country_city',
      data: {},
      success: function (msg) {
        let country_html = '';
        for (var key in msg['receivedData']) {
          country_html += `<option value='${msg['receivedData'][key]}'>${msg['receivedData'][key]}</option>`;
        }
        $('#select_country').html(country_html);
        updateCities();
      },
    });
  }


  // 國家相對應城市
  function updateCities() {
    var country = document.getElementById('select_country').value;
    $.ajax({
      type: 'POST',
      url: '/get_country_city',
      data: { country: country },
      success: function (msg) {
        let city_html = '';
        for (var key in msg['receivedData']) {
          city_html += `<option value='${msg['receivedData'][key]}'>${msg['receivedData'][key]}</option>`;
        }
        $('#select_city').html(city_html);
      },
    });
  }
