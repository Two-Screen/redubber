# Redubber

Redubber can be used to control multiple Redis PubSub servers through 
[redub](https://github.com/two-screen/redub) and 
[redis-pubsub](https://github.com/two-screen/redis-pubsub).

## Usage

Redubber can be used from the terminal. It requires a configuration file to tell it what
servers and channels to listen to. This will file is simple JSON file containing a list of
servers and a list of channels:

```json
{
    "channels": [ "message" ],
    "servers":  [ "localhost:6379" ]
}
```

## Monitor

You can monitor messages received on multiple Redis servers from the CLI

```bash
$ redubber monitor
```

## Send

Messages can be send from the commandline as arguments to the send command:

```bash
$ redubber send "a message"
```

### Options

- `-c|--channel CHANNEL`: The channel to send the message to
- `-j|--json`: Treat input as json and parse it
- `-a`: Read input from STDIN

Messages can also be read from `STDIN` by piping it into `redubber`:

```bash
$ cat message.json | redubber send -j -a
```

# License

(The MIT License)

Copyright (c) 2012, Two Screen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
