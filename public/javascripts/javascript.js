function updateCountry() {
  return axios
  .post('/get_country_city')
  .then(function (response) {
    let country_html = '';
    for (var key in response.data['receivedData']) {
      country_html += `<option value='${response.data['receivedData'][key]}'>${response.data['receivedData'][key]}</option>`;
    }
    $('#select_country').html(country_html);
  })
  .catch(function (error) {
    console.log(error);
  })
  .finally(function () {
  });
  }

  // 國家相對應城市
  function updateCities() {
    var country = document.getElementById('select_country').value;
    return axios
    .post('/get_country_city', {country: country})
    .then(function (response) {
      let city_html = '';
      for (var key in response.data['receivedData']) {
        city_html += `<option value='${response.data['receivedData'][key]}'>${response.data['receivedData'][key]}</option>`;
      }
      $('#select_city').html(city_html);
    })
    .catch(function (error) {
      console.log(error);
    })
    .finally(function () {
    });
  }

  async function updateCountryCities(Country=undefined, city=undefined) {
    await updateCountry();
    if (Country){
      $('#select_country').val(Country);
    }
    await updateCities();
    if (city){
      $('#select_city').val(city);
    }
  }
