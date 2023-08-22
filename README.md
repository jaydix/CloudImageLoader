# CloudImageLoader

 This is a server that lets you render an image from your computer onto Scratch over cloud variables. You can check out [this project](https://scratch.mit.edu/projects/873231212) to see a client example.

## Setup

*You will need Node.js to run this server.*

1. Install the required libraries for this project.

   ```terminal
    npm i
    ```

2. Run `genConfig.cjs` to generate the config file needed for the server to run.

    ```terminal
    node genConfig.cjs
    ```

    Don't worry; your password will not be shown in the terminal.

3. You should also replace `input.png` with your own file, if you want to render a different image.
4. Run `index.js`.

   ```terminal
    node index.js
    ```

5. Wait for reading to finish before starting the Scratch project linked with the server. This can take a bit.

If you've done everything correctly, you should see your image begin to render on the Scratch side!

*Note that the image may tear occasionally due to lag.*

## Common Errors
 *`Error: Unexpected server response: 502`*
 This is a problem with the Scratch cloud library I'm using. Restart the server.
