export const examTopics = [
	{
		id: 1,
		title: "LLM Architecture",
		weight: 6,
		subtopics: [
			"1.1 Analyze encoder-decoder structures and their applications",
			"1.2 Describe transformer architectures including self-attention mechanisms",
			"1.3 Develop code to extract embeddings from both encoder and decoder models",
			"1.4 Implement advanced sampling techniques for text generation",
			"1.5 Understand output sampling techniques used in decoder-based language models",
			"1.6 Understand the concept of embeddings"
		],
		readings: [
			{
				title: "Mastering LLM Techniques: Training",
				url: "https://blogs.nvidia.com/blog/mastering-llm-techniques-training/"
			},
			{
				title: "Attention Is All You Need",
				url: "https://arxiv.org/abs/1706.03762"
			}
		]
	},
	{
		id: 2,
		title: "Prompt Engineering",
		weight: 13,
		subtopics: [
			"2.1 Engineer effective prompts and templates, including chain-of-thought and prompt learning for small datasets or specialized domains",
			"2.2 Employ zero-shot, one-shot, and few-shot techniques to expand model adaptability",
			"2.3 Train decoder-based LLMs with causal language modeling as needed",
			"2.4 Design specialized LLM-wrapping modules with built-in validation and constrained decoding for improved consistency, reduced hallucinations, and better user experience"
		],
		readings: [
			{
				title: "Mastering LLM Techniques: Inference Optimization",
				url: "https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/"
			},
			{
				title: "An Easy Introduction to LLM Reasoning, AI Agents, and Test-Time Scaling",
				url: "https://developer.nvidia.com/blog/an-easy-introduction-to-llm-reasoning-ai-agents-and-test-time-scaling/"
			},
			{
				title: "Train a Reasoning-Capable LLM in One Weekend With NVIDIA NeMo™",
				url: "https://developer.nvidia.com/blog/train-a-reasoning-capable-llm-in-one-weekend-with-nvidia-nemo/"
			},
			{
				title: "Multi-Turn Conversational Chat Bot NVIDIA Generative AI Examples",
				url: "https://nvidia.github.io/GenerativeAIExamples/0.5.0/multi-turn.html"
			}
		]
	},
	{
		id: 3,
		title: "Data Preparation",
		weight: 9,
		subtopics: [
			"3.1 Clean and curate data (handle missing, normalize, scale), and analyze class imbalances and feature distributions",
			"3.2 Organize datasets, ensure correct formats, and prepare data for modeling",
			"3.3 Select and train tokenizers and optimize tokenization strategies and vocabulary size (BPE and WordPiece) to fit tasks and resources"
		],
		readings: [
			{
				title: "NVIDIA/GenerativeAIExamples",
				url: "https://github.com/NVIDIA/GenerativeAIExamples"
			},
			{
				title: "NVIDIA AI Workbench Example Projects",
				url: "https://docs.nvidia.com/ai-workbench/user-guide/latest/examples/index.html"
			},
			{
				title: "Tokenizers NVIDIA NeMo Framework User Guide",
				url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/nlp/tokenizers.html"
			},
			{
				title: "NVIDIA/NeMo",
				url: "https://github.com/NVIDIA/NeMo"
			},
			{
				title: "Train Models Using a Distributed Training Workload",
				url: "https://docs.nvidia.com/ai-workbench/user-guide/latest/examples/distributed-training.html"
			},
			{
				title: "Speed Up Data Exploration With NVIDIA RAPIDS™ cuDF",
				url: "https://developer.nvidia.com/blog/speed-up-data-exploration-with-nvidia-rapids-cudf/"
			},
			{
				title: "Accelerating Time-Series Forecasting With RAPIDS cuML",
				url: "https://developer.nvidia.com/blog/accelerating-time-series-forecasting-with-rapids-cuml/"
			},
			{
				title: "Model Fine-Tuning NVIDIA NeMo Framework User Guide",
				url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/playbooks/llama3training.html"
			},
			{
				title: "NeMo Curator",
				url: "https://developer.nvidia.com/nemo-curator"
			},
			{
				title: "Faster Causal Inference on Large Datasets With NVIDIA RAPIDS",
				url: "https://developer.nvidia.com/blog/faster-causal-inference-on-large-datasets-with-nvidia-rapids/"
			},
			{
				title: "Fine-Tuning NVIDIA NeMo Framework User Guide",
				url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/nlp/nemo_megatron/gpt/gpt_training.html"
			}
		]
	},
	{
		id: 4,
		title: "Model Optimization",
		weight: 17,
		subtopics: [
			"4.1 Apply pruning, sparsity, and weight/activation quantization to reduce memory footprint and optimize model inference for hardware acceleration",
			"4.2 Choose and implement quantization strategies (post-training, quantization-aware, activation quantization) tailored for hardware and tasks (e.g., NVIDIA A100/H100 Tensor Core GPUs, FP16, INT8), and measure any accuracy trade-offs",
			"4.3 Implement knowledge distillation to create smaller, efficient models based on larger pretrained ones",
			"4.4 Conduct systematic hyperparameter tuning and distributed parameter search, including learning rate schedules and batch size adjustments",
			"4.5 Use advanced sampling (beam search, temperature scaling) and systematic ablation studies to evaluate model optimization impact",
			"4.6 Select and apply optimization methods (NVIDIA TensorRT™, sliding-window/streaming attention, key-value caching) based on architecture, task, and available resources",
			"4.7 Train encoder-based foundation LLMs with masked language modeling (MLM) and/or next sentence prediction, and understand quantization, distillation, and model pruning concepts"
		],
		readings: [
			{
				title: "Best Practices for TensorRT Performance",
				url: "https://docs.nvidia.com/deeplearning/tensorrt/best-practices/index.html"
			},
			{
				title: "Quantization NVIDIA NeMo User Guide",
				url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/quantization.html"
			},
			{
				title: "DistilBERT, a Distilled Version of BERT",
				url: "https://arxiv.org/abs/1910.01108"
			},
			{
				title: "What Is Knowledge Distillation?",
				url: "https://www.ibm.com/topics/knowledge-distillation"
			},
			{
				title: "Sparsity in INT8: Training Workflow and Best Practices for NVIDIA TensorRT Acceleration",
				url: "https://developer.nvidia.com/blog/sparsity-in-int8-training-workflow-and-best-practices-for-tensorrt-acceleration/"
			},
			{
				title: "Quantization and Calibration NVIDIA TensorRT Documentation",
				url: "https://docs.nvidia.com/deeplearning/tensorrt/developer-guide/index.html#working-with-int8"
			},
			{
				title: "Post-Training Quantization vs. Quantization-Aware Training",
				url: "https://library.fiveable.me/key-terms/deep-learning-systems/post-training-quantization-vs-quantization-aware-training"
			},
			{
				title: "Quantization-Aware Training (QAT) vs. Post-Training Quantization (PTQ)",
				url: "https://medium.com/betterml/quantization-aware-training-qat-vs-post-training-quantization-ptq-5d0f8c033f02"
			},
			{
				title: "The Illustrated Transformer",
				url: "https://jalammar.github.io/illustrated-transformer/"
			},
			{
				title: "Understanding Data Types in AI and HPC",
				url: "https://www.itsaboutai.com/p/understanding-data-types-in-ai-and-hpc"
			},
			{
				title: "Quantization: What You Should Understand if You Want to Run LLMs",
				url: "https://www.linkedin.com/pulse/quantization-what-you-should-understand-want-run-llms-pavan-mantha-fdrof/"
			},
			{
				title: "Capabilities NVIDIA TensorRT Documentation",
				url: "https://docs.nvidia.com/deeplearning/tensorrt/developer-guide/index.html#capabilities"
			},
			{
				title: "LoRA: Low-Rank Adaptation of Large Language Models",
				url: "https://openreview.net/forum?id=nZeVKeeFYf9"
			},
			{
				title: "GPTQ: Accurate Post-Training Quantization for Generative Pretrained Transformers",
				url: "https://arxiv.org/abs/2210.17323"
			}
		]
	},
	{
		id: 5,
		title: "Fine-Tuning",
		weight: 13,
		subtopics: [
			"5.1 Align models with intent via supervised fine-tuning or reinforcement learning from human feedback, including methods like direct preference optimization (DPO) or group relative policy optimization (GRPO)",
			"5.2 Apply contrastive loss for embeddings and use parameter-efficient techniques (LoRA, adapters, P-tuning)",
			"5.3 Implement early stopping to prevent overfitting and select performance metrics for all phases",
			"5.4 Mitigate hallucinations, assess fine-tuning impact, and perform parameter-efficient updates for LLMs"
		],
		readings: [
			{
				title: "Deploy Diverse AI Apps With Multi-LoRA Support on NVIDIA RTX™ AI PCs and Workstations",
				url: "https://blogs.nvidia.com/blog/multi-lora-rtx-ai-pc/"
			},
			{
				title: "Selecting Large Language Model Customization Techniques",
				url: "https://developer.nvidia.com/blog/selecting-large-language-model-customization-techniques/"
			},
			{
				title: "LoRA: Low-Rank Adaptation of Large Language Models",
				url: "https://arxiv.org/abs/2106.09685"
			},
			{
				title: "Parameter-Efficient Fine-Tuning for LLMs With NVIDIA NeMo",
				url: "https://developer.nvidia.com/blog/parameter-efficient-fine-tuning-for-llms-with-nvidia-nemo/"
			},
			{
				title: "Prevent LLM Hallucinations With the Cleanlab Trustworthy Language Model in NVIDIA NeMo Guardrails",
				url: "https://developer.nvidia.com/blog/prevent-llm-hallucinations-with-the-cleanlab-trustworthy-language-model-in-nvidia-nemo-guardrails/"
			},
			{
				title: "Chapter 7, Regularization for Deep Learning",
				url: "https://www.deeplearningbook.org/contents/regularization.html"
			},
			{
				title: "LLM Evaluation Metrics: BLEU, ROUGE, and METEOR Explained",
				url: "https://medium.com/@sthanikamsanthosh1994/understanding-bleu-and-rouge-score-for-nlp-evaluation-1ab334ecadcb"
			}
		]
	},
	{
		id: 6,
		title: "Evaluation",
		weight: 7,
		subtopics: [
			"6.1 Analyze benchmark results, conduct human-in-the-loop and LLM-as-a-judge evaluations, and assess model quality using key metrics (BLEU, ROUGE, Perplexity)",
			"6.2 Diagnose LLM failure modes and perform systematic error analysis to identify common behavioral and output patterns",
			"6.3 Benchmark and compare LLM deployments across various platforms (on-prem DGX, cloud GPUs) using standardized evaluation metrics",
			"6.4 Design and implement comprehensive evaluation frameworks integrating all the above practices for robust and scalable model assessment"
		],
		readings: [
			{
				title: "NVIDIA Metrics | Ragas",
				url: "https://docs.ragas.io/en/latest/references/metrics/"
			},
			{
				title: "Retrieval-Augmented Generation (RAG) Pipeline",
				url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/playbooks/rag.html"
			},
			{
				title: "Evaluating Medical RAG With NVIDIA AI Endpoints and Ragas",
				url: "https://developer.nvidia.com/blog/evaluating-medical-rag-with-nvidia-ai-endpoints-and-ragas/"
			},
			{
				title: "Integrations | Ragas",
				url: "https://docs.ragas.io/en/latest/howtos/integrations/"
			},
			{
				title: "NVIDIA-AI-Blueprints/RAG",
				url: "https://github.com/NVIDIA-AI-Blueprints/RAG"
			},
			{
				title: "NeMo Evaluator",
				url: "https://developer.nvidia.com/nemo-evaluator"
			},
			{
				title: "Introduction—NVIDIA Autonomous Vehicles Safety Report",
				url: "https://www.nvidia.com/content/dam/en-zz/Solutions/self-driving-cars/safety-report/NVIDIA-Autonomous-Vehicles-Safety-Report-2023.pdf"
			},
			{
				title: "Performance Analysis Tools",
				url: "https://developer.nvidia.com/performance-analysis-tools"
			},
			{
				title: "Deployment Best Practices—NVIDIA RTX vWS",
				url: "https://docs.nvidia.com/vgpu/latest/grid-vgpu-user-guide/index.html#best-practices-for-deploying-vgpu"
			},
			{
				title: "Troubleshoot NVIDIA NIM for LLMs",
				url: "https://docs.nvidia.com/nim/large-language-models/latest/troubleshooting.html"
			},
			{
				title: "How the DGX H100 Accelerates AI Workloads",
				url: "https://www.cudocompute.com/blog/how-the-dgx-h100-accelerates-ai-workloads"
			},
			{
				title: "Masked Language Model Scoring",
				url: "https://arxiv.org/abs/1910.14659"
			},
			{
				title: "Perplexity of Fixed-Length Models",
				url: "https://huggingface.co/docs/transformers/perplexity"
			},
			{
				title: "The Importance of Starting With Error Analysis in LLM Applications",
				url: "https://shekhargulati.com/2023/09/12/the-importance-of-starting-with-error-analysis-in-llm-applications/"
			}
		]
	},
	{
		id: 7,
		title: "GPU Acceleration and Optimization",
		weight: 14,
		subtopics: [
			"7.1 Configure multi-GPU and distributed training setups (DDP, FSDP, model, pipeline, tensor, data, sequence, and expert parallelism)",
			"7.2 Apply Tensor Core and mixed-precision optimizations and batch/memory management for efficient throughput",
			"7.3 Distribute and optimize self-attention head general matrix multiplication (GEMM) operations and implement gradient accumulation for large models or limited GPU memory",
			"7.4 Identify and address bottlenecks using CUDA profiling and troubleshoot memory and kernel efficiency issues"
		],
		readings: [
			{
				title: "Distributed Data Parallel in PyTorch",
				url: "https://pytorch.org/tutorials/intermediate/ddp_tutorial.html"
			},
			{
				title: "CUDA C++ Best Practices Guide 13.0",
				url: "https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html"
			},
			{
				title: "Assess, Parallelize, Optimize, Deploy",
				url: "https://blogs.nvidia.com/blog/assess-parallelize-optimize-deploy/"
			},
			{
				title: "Parallelisms — NVIDIA NeMo User Guide",
				url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/parallelisms.html"
			},
			{
				title: "Batching — NVIDIA NeMo Developer Docs",
				url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/batching.html"
			},
			{
				title: "PyTorch Lightning: Gradient Accumulation",
				url: "https://github.com/Lightning-AI/pytorch-lightning/blob/master/docs/source-pytorch/common/trainer.rst#accumulate-grad-batches"
			},
			{
				title: "Accelerate Usage Guides: Gradient Accumulation",
				url: "https://huggingface.co/docs/accelerate/usage_guides/gradient_accumulation"
			}
		]
	},
	{
		id: 8,
		title: "Model Deployment",
		weight: 9,
		subtopics: [
			"8.1 Analyze computational tradeoffs for model types (encoder, decoder, encoder-decoder) and optimize for memory and latency",
			"8.2 Build containerized inference pipelines, use dynamic batching, and deploy with NVIDIA Dynamo-Triton",
			"8.3 Configure and manage serving (Kubernetes, ensemble workflows), implement live monitoring, and run models in Docker"
		],
		readings: [
			{
				title: "NVIDIA NIM Microservices for Accelerated AI Inference",
				url: "https://www.nvidia.com/en-us/ai-data-science/products/nim/"
			},
			{
				title: "Overview of NVIDIA NIM for Large Language Models (LLMs)",
				url: "https://docs.nvidia.com/nim/large-language-models/latest/introduction.html"
			},
			{
				title: "Power Your AI Projects With New NVIDIA NIMs for Mistral and Mixtral Models",
				url: "https://blogs.nvidia.com/blog/mistral-mixtral-nim/"
			},
			{
				title: "Concurrent Model Execution—Dynamo-Triton User Guide",
				url: "https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html#concurrent-model-execution"
			},
			{
				title: "Model Configuration—Dynamo-Triton User Guide",
				url: "https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html"
			},
			{
				title: "Schedulers—Dynamo-Triton User Guide",
				url: "https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html#scheduling-and-batching"
			},
			{
				title: "Batchers—Dynamo-Triton User Guide",
				url: "https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html#dynamic-batcher"
			}
		]
	},
	{
		id: 9,
		title: "Production Monitoring and Reliability",
		weight: 7,
		subtopics: [
			"9.1 Define monitoring dashboards and reliability metrics",
			"9.2 Track logs, errors, and anomalies for root-cause diagnosis",
			"9.3 Continuously benchmark deployed agents against prior versions",
			"9.4 Implement automated tuning, retraining, and versioning in production",
			"9.5 Ensure continuous uptime, transparency, and trust in live deployments"
		],
		readings: [
			{
				title: "Attention Is All You Need",
				url: "https://arxiv.org/abs/1706.03762"
			},
			{
				title: "BERT: Pretraining of Deep Bidirectional Transformers for Language Understanding",
				url: "https://arxiv.org/abs/1810.04805"
			},
			{
				title: "Improving Language Understanding by Generative Pretraining",
				url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf"
			},
			{
				title: "Masked Language Modeling Guide",
				url: "https://huggingface.co/docs/transformers/tasks/masked_language_modeling"
			},
			{
				title: "Causal Language Modeling Guide",
				url: "https://huggingface.co/docs/transformers/tasks/language_modeling"
			}
		]
	},
	{
		id: 10,
		title: "Safety, Ethics, and Compliance",
		weight: 5,
		subtopics: [
			"10.1 Apply responsible AI practices to model deployment",
			"10.2 Audit LLMs for bias and fairness",
			"10.3 Configure monitoring systems for production LLMs",
			"10.4 Implement bias detection and mitigation strategies",
			"10.5 Implement guardrails to restrict undesired LLM responses"
		],
		readings: [
			{
				title: "Build an Enterprise RAG Pipeline Blueprint",
				url: "https://build.nvidia.com/nvidia/rag-playground"
			},
			{
				title: "RAG 101: Demystifying Retrieval-Augmented Generation Pipelines",
				url: "https://developer.nvidia.com/blog/rag-101-demystifying-retrieval-augmented-generation-pipelines/"
			},
			{
				title: "Full-Stack Observability for NVIDIA Blackwell and NIM-Based AI",
				url: "https://www.dynatrace.com/news/blog/full-stack-observability-for-nvidia-blackwell-and-nim-based-ai/"
			},
			{
				title: "Large-Scale Production Deployment of RAG Pipelines",
				url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-15+V1"
			},
			{
				title: "Observability Tool NVIDIA Generative AI Examples",
				url: "https://nvidia.github.io/GenerativeAIExamples/latest/observability.html"
			},
			{
				title: "NVIDIA-AI-Blueprints/RAG",
				url: "https://github.com/NVIDIA-AI-Blueprints/RAG"
			},
			{
				title: "Measuring the Effectiveness and Performance of AI Guardrails in Generative AI Applications",
				url: "https://developer.nvidia.com/blog/measuring-the-effectiveness-and-performance-of-ai-guardrails-in-generative-ai-applications/"
			}
		]
	}
];


