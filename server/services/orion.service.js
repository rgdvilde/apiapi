const axios = require('axios')
class OrionClient {
  constructor () {
  }

 getData(id) {
  console.log('GETTING DATA')
  return axios.get('http://localhost:1026/version',
    {
      'params': 
      {
        'id':id
      }
    })
  .then((res) => {
    if (res) {
      return res
    }
  })
}

 getDataQuery(q) {
  console.log('GETTING DATA')
  return axios.get('http://localhost:1026/ngsi-ld/v1/entities',
    {
      'params': q
    })
  .then((cachedResponse) => {
    if (res) {
      return res
    }
  })
  .catch(err => console.log(err))
}


  setData (data) {
    console.log('SETTING DATA')
    axios.post('http://localhost:1026/ngsi-ld/v1/entities', payload, 
                { headers: { "content-type": "application/ld+json" } })
                .then(res => console.log(res.status))
                .catch(err => console.log(err))
}

 removeData(entityids) {
    console.log('REMOVING DATA')
    axios.post('http://localhost:1026/ngsi-ld/v1/entityOperations/delete', entityids)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
}


  flushDb () {
    if (!this.client) { return Promise.reject(new Error('Client is not initialized')) }
    return this.client.flushallAsync()
  }
}

module.exports = new OrionClient()
