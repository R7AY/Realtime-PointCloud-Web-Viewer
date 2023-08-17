class Socket {
    /**
     * @description: ��ʼ��ʵ�����ԣ��������
     * 
     */
    constructor(options) 
    {
        this.url = options.url;
        this.callback = options.received;
        this.name = options.name || 'default';
        this.ws = null;
        this.status = null;
        this.pingInterval = null;
        // �������Ƶ��
        this._timeout = 5000;
        this.isHeart = options.isHeart;
        this.isReconnection = options.isReconnection;
    }
    connect(data) 
    {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType="arraybuffer";
        // ��������
        this.ws.onopen = (e) => 
        {
            this.status = 'open';
            console.log("succeed to connect",e)
            if(this.isHeart) 
            {
                // ����
                this._heartCheck()
            }
            // ����̨��������
            if(data !== undefined) 
            {
                return this.ws.send(JSON.stringify({type: 'init'}))
            }
        }
        // ���ܷ��������ص���Ϣ
        this.ws.onmessage = (e) => 
        {
            if(typeof this.callback === 'function')
            {
                setTimeout(() => 
                {
                    this.callback(e.data)
                }, 10
                );

                this.sendMsg("OK");
            }
            else
            {
                console.log('parameter must be a callback function')
            }
        }
        // �ر�����
        this.ws.onclose = (e) => 
        {
            console.log('onclose',e)
            this._closeSocket(e)
        }
        // ����
        this.onerror = (e) => 
        {
            console.log('onerror',e)
            this._closeSocket(e)
        }
    }
    sendMsg(data) 
    {
        let msg = JSON.stringify(data)
        return this.ws.send(msg)
    }
    _resetHeart() 
    {
        clearInterval(this.pingInterval)
        return this
    }
    _heartCheck() 
    {
        this.pingInterval = setInterval(() => 
        {
            if(this.ws.readyState === 1) 
            {
                this.ws.send(JSON.stringify({type: 'ping'}))
            }
        }, this._timeout)
    }
    _closeSocket(e) 
    {
        this._resetHeart()
        if(this.status !== 'close')
        {
            console.log('disconnect, reconnect',e)
            if(this.isReconnection)
            {
                setTimeout(() =>
                {
                    this.connect()
                }, 5000 // reconnect per 5s
                );
            }
        }
        else
        {
            // �ֶ��ر���
            console.log('manual close',e)
        }
    }
    close() 
    {
        this.status = 'close'
        this._resetHeart()
        return this.ws.close();
    }
}




