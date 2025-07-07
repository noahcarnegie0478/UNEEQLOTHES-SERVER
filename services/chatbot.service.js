const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateStreamCommand,
} = require("@aws-sdk/client-bedrock-agent-runtime");
const client = new BedrockAgentRuntimeClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  enableTrace: true,
});
const FoundationModel = Object.freeze({
  CLAUDE_3_SONNET: {
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    modelName: "Anthropic Claude 3 Sonnet",
    module: () => import("../models/anthropicClaude/invoke_claude_3.js"),
    invoker: (/** @type {Module} */ module) => module.invokeModel,
  },
});
const retreiveInput = async (req, res) => {
  const { user_input } = req.body;
  console.log(user_input);
  try {
    const input = {
      input: {
        text: user_input,
      },
      retrieveAndGenerateConfiguration: {
        type: "KNOWLEDGE_BASE",
        knowledgeBaseConfiguration: {
          knowledgeBaseId: process.env.KB_ID,
          modelArn: FoundationModel.CLAUDE_3_SONNET.modelId,
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 5,
            },
          },
        },
      },
      generationConfiguration: {
        temperature: 0.5,
        topP: 0.9,
      },
    };
    const command = new RetrieveAndGenerateStreamCommand(input);
    const response = await client.send(command);
    const result = await checkOutput(response);
    return res.status(200).send(result);
  } catch (error) {
    throw error;
  }
};

const checkOutput = async params => {
  if (!params.stream) return "";
  let answer = "";
  for await (const event of params.stream) {
    if (event.output) {
      process.stdout.write(event.output.text);
      answer += event.output.text;
    }
    if (event.citations) {
      console.log("Citations:", JSON.stringify(event.citations));
    }
  }
  return answer;
};

module.exports = {
  FoundationModel,
  retreiveInput,
};
