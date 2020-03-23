import React, {useEffect, useState} from 'react';
import './MissionTable.scss';

function MissionTable({data}) {

  const [missionsData, setMissionsData] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {

    let sortedData = [...data].sort((a, b) => {
      const timeA = (new Date(a.date)).getTime();
      const timeB = (new Date(b.date)).getTime();
      return timeA > timeB ? 1 : (timeA < timeB ? -1 : 0)
    });

    findMostIsolatedCountry(sortedData);

    const apiKey = '283546a8083c4b';
    const apiUrl = 'https://us1.locationiq.com/v1/search.php';

    fetch(`${apiUrl}?key=${apiKey}&q=10 Downing st. London&format=json`).then(res => res.json()).then(downing => {
      let apiCalls = [];
      for (let i = 0; i < sortedData.length; i++) {
        const {address, country} = sortedData[i];
        //staggering API calls to comply with call per second limit. Will of course not be a problem if using a paid API service
        setTimeout(() => {
          apiCalls.push(
            fetch(`${apiUrl}?key=${apiKey}&q=${address}, ${country}&format=json`).then(res => res.json()).then(location => {
              return distance(location, downing);
            })
          )

          if (i === sortedData.length - 1) {
            Promise.all(apiCalls).then(res => {
              sortedData[res.indexOf(Math.max(...res))].max = true;
              sortedData[res.indexOf(Math.min(...res))].min = true;
              setMissionsData(sortedData);
              setReady(true);              
            });
          }
        }, 600 * i);        
      }
      
    });

  }, [data]);

  const distance = (p1, p2) => {
    var R = 3958.8; // Radius of the Earth in miles
    var rlat1 = p1[0].lat * (Math.PI/180); // Convert degrees to radians
    var rlat2 = p2[0].lat * (Math.PI/180); // Convert degrees to radians
    var difflat = rlat2-rlat1; // Radian difference (latitudes)
    var difflon = (p2[0].lon-p1[0].lon) * (Math.PI/180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
    return d;
  }
 
  const findMostIsolatedCountry = missions => {
    let agentsTable = {};
    let countriesTable = {};
    for (let mission of missions) {
      const {agent, country} = mission;
      agentsTable[agent] = agentsTable[agent] ? 'disqualified' : country;
    }
    for (let country of Object.values(agentsTable)) {
      if (country !== 'disqualified') {
        countriesTable[country] = countriesTable[country] ? countriesTable[country] + 1 : 1;
      }
    }
    let mostIsolatedCountry = Object.entries(countriesTable)
                                .sort((a, b) => {
                                  const isolatedAgentsInA = a[1];
                                  const isolatedAgentsInB = b[1];
                                  return isolatedAgentsInA > isolatedAgentsInB ? -1 : (isolatedAgentsInA < isolatedAgentsInB ? 1 : 0)
                                })
                                [0];

    const [country, degree] = mostIsolatedCountry;
    console.log(`%c The most isolated country is ${country} with an isolation degree of ${degree}.` , 'color: blue; font-size:20px;');

    return mostIsolatedCountry;
  }

  const renderTableRows = missions => {
    return missions.map(mission => {
      const {agent, country, address, date, min, max} = mission;
      return (
        <tr key={`${Date.now()}${Math.random()}`} className={min ? 'min' : (max ? 'max' : '')}>
          <td>{agent}</td>
          <td>{country}</td>
          <td>{address}</td>
          <td>{date}</td>
        </tr>
      )
    })
  }

  const renderTable = missions => {

    return (
      ready ? <table>
        <thead>
          <tr>
            <th className="agent">Agent ID</th>
            <th className="country">Country</th>
            <th className="address">Address</th>
            <th className="date">Date</th>
          </tr>
        </thead>
        <tbody>
          {renderTableRows(missionsData)}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4">{`${missions.length} missions`}</td>
          </tr>          
        </tfoot>
      </table> : <div className="loader">Loading... Please Wait.</div>
    )
  }

  return (
    <div className="missionTable">
      {renderTable(data)}
    </div>
  );
}

export default MissionTable;
