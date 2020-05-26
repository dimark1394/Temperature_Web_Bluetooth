
var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: [],
        datasets: [{
            label: 'Temp per 1 sec',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: ''
        }]
    },
    options: {
        scales: {
            responsive: true,
            xAxes:[{
                ticks: {
                    maxTicksLimit: 20
                },
                type: 'time' ,
                time: {
                    displayFormats: {
                        millisecond: 'h:mm:ss.SSS'
                    }
                }
            }],
            yAxes: [{
                ticks: {
                    stepSize: 1,
                    suggestedMax: 30,
                    suggestedMin: 15
                }
            }]
        }
    }
});

//declaration of services and characteristics
agservice  = '326a9000-85cb-9195-d9dd-464cfbbae75a';
agwritechar = '326a9001-85cb-9195-d9dd-464cfbbae75a';
aggetvalschar = '326a9006-85cb-9195-d9dd-464cfbbae75a';

//function to see if web bluetooth is available on your system
function isWebBLEOn(){
    if (!navigator.bluetooth){
        console.log ('Web Bluetooth is not Available!' )
        return false
    }
    return true
}

//make the connect button work
document.querySelector('#readbatterylevel').addEventListener('click', funct)
function funct(event) {
    console.log('starting');
    document.getElementById('message').innerText = 'Connecting';
    event.stopPropagation()
    event.preventDefault()
    if(isWebBLEOn()){
        connectToDevice();
    }
}

let devicevar;
let configchar;
let datachar;
let servervar;
let servicevar;

// async function to connect to the GATT server and discover the Services and Characteristics
async function connectToDevice(){
    try {
        //scan only for the device with the preferred name
        devicevar = await navigator.bluetooth.requestDevice({
            filters:[{namePrefix: ['MetaWear']}],
            optionalServices: [agservice]
        });
        //check if the device is found
        if (devicevar){
            console.log('found device');
        }
        //connect to the device's GATT server
        servervar = await devicevar.gatt.connect();
        if (servervar){
            console.log('connected to server');
        }
        servicevar = await servervar.getPrimaryService(agservice);
        //getting the primary service
        if(servicevar){
            console.log('got service');
            document.getElementById('message').innerText = 'Connected';
        }
        //getting the characteristics
        configchar = await servicevar.getCharacteristic(agwritechar);
        datachar = await servicevar.getCharacteristic(aggetvalschar);
        //add an event listener to the characteristic as to monitor its values' changes
        datachar.addEventListener('characteristicvaluechanged',handlechangetemp)

    }//plain error checking
    catch (error) {
        console.log(error.message);
        document.getElementById('message').innerText = 'Something Went Wrong! Pleas Try Again!';
    }
}

//selector for the configure button and call the function to configure the device
document.querySelector('#configure').addEventListener('click',function(event){
    if(isWebBLEOn()){
        writetodevice();
    }
});

// commands to write το the config characteristic
let value = new Uint8Array([0x0b,0x84]);
let value1 = new Uint8Array ( [0x11,0x09,0x06,0x00,0x09,0x00,0x00,0x00,0x58,0x02]);
let value2 = new Uint8Array([0x02,0x03,0x00,0x02,0x1f,0x00,0x64,0x00,0xc8,0x00,0x64,0x00,0x20,0x03,0x00,0x00,0x03]);
let value3 = new Uint8Array([0x02,0x03,0x01,0x02,0x0a,0x00,0x64,0x00,0xc8,0x00,0x64,0x00,0x98,0x3a,0x60,0x09,0xff]);
let value4 = new Uint8Array([0x02,0x01,0x01]);
let value5 = new Uint8Array([0x0c,0x02,0xe8,0x03,0x00,0x00,0xff,0xff,0x01]);
let value6 = new Uint8Array([0x0a,0x02,0x0c,0x06,0x00,0x04,0x81,0x01]);
let value7 = new Uint8Array([0x0a,0x03,0x01]);
let value8 = new Uint8Array([0x0c,0x03,0x00]);

//function to write the commands to the the device
async function writetodevice() {
    console.log('start notifications');
    await datachar.startNotifications();
    await configchar.writeValue(value);
    await configchar.writeValue(value1);
    await configchar.writeValue(value2);
    await configchar.writeValue(value3);
    await configchar.writeValue(value4);
    await configchar.writeValue(value5);
    await configchar.writeValue(value6);
    await configchar.writeValue(value7);
    await configchar.writeValue(value8);
}

//selector for the reset button and call to the reset function
document.querySelector('#reset').addEventListener('click', function (event) {
    if(isWebBLEOn()){
        resetDevice();
    }
});
//function to handle the data being sent from the device via notifications
async function handlechangetemp(event){
    if (event.target.value.buffer.byteLength === 5) {
        //only keep the important bytes for our temps
        let sliced = event.target.value.buffer.slice(2, 5);
        let table = new Int8Array(sliced);
        //change the first byte to 41 in hex so ieee754 conversion stands
        table[0] = 65;
        let buffer = new ArrayBuffer(4);
        let view = new DataView(buffer);
        view.setInt8(0, table[0]);
        view.setInt8(1, table[1]);
        view.setInt8(2, table[2]);
        view.setInt8(3, 0);
        let Temperature = view.getFloat32(0);
        addData(Temperature);
        let DateTime = new Date();
        const data = {DateTime ,Temperature};
        const options = {
            method: 'POST',
            body: JSON.stringify(data),
            headers:{
                'Content-Type': 'application/json'
            }

        }
        const response = await  fetch('/api',options);
        const json = await response.json();
        console.log(json);
    }

}
//function to reset the device to default config and disconnect GATT server
async function resetDevice() {
    console.log('resseting');
    while(chart.data.labels.length){
        chart.data.labels.pop();
    }
    chart.update();
    try{
        document.getElementById('message').innerText = 'Disconnected! Please press again the Scan for Devices to start a new session';
        const val = new Uint8Array([0xfe,0x01]);
        await configchar.writeValue(val);
        if(!devicevar.gatt.connected){
            console.log('disconnected');
        }
    }catch(error){
        console.log(error.message)
    }
}

function addData(temperature) {
    chart.data.labels.push(new Date());
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(temperature);
    });
    chart.update();
}





