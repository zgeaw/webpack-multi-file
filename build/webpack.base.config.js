const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const cleanWebpackPlugin = require('clean-webpack-plugin');

// 引入多页面文件列表
const {htmlDirs} = require('./config.js');
// 通过 html-webpack-plugin 生成的 HTML 集合
let HTMLPlugins = [];
// 入口文件集合
let Entries = {
	common:'./src/js/common/common.js'
}
// 生成多页面的集合
if(htmlDirs && htmlDirs.length > 0){	
	htmlDirs.forEach((page) => {
		const htmlPlugin = new HtmlWebpackPlugin({
			filename: resolve(`/dist/${page}.html`),
			template: `./src/${page}.html`,
			chunks: ['common', page],
		});
		HTMLPlugins.push(htmlPlugin);
		Entries[page] = path.resolve(__dirname, `../src/js/${page}.js`);
	});
}

// node:{
//         __dirname:true//“__dirname”是node.js中的一个全局变量，它指向当前执行脚本所在的目录。
//     }
function resolve(dir){//因为自己改变了文件的路径，这里需要重新处理一下
    return path.join(__dirname,'..',dir);
}

module.exports = {
    entry: Entries,
    output:{//指示webpack如何去输出，以及在哪里输出你的「bundle、asset和其他你所打包或使用webpack载入的任何内容」。
        path:path.join(__dirname,'../dist/'),//目录对应一个绝对路径
        //pathinfo:true,//告诉 webpack 在 bundle 中引入「所包含模块信息」的相关注释。默认是false，pathinfo是在开发环境中使用，在生产环境中就不推荐
        filename:'js/[name].[chunkhash].min.js',//filename选项决定了在每个输出bundle的名称。这些bundle将写入到「output.path」选项指定的目录下。2017-08-09版本叠加，添加hash，有利于管理
        //publicPath:'/',//值是string类型，对于加载（on-demand-load）或加载外部资源(external resources)（如图片、文件等）来说
        //output.publicPath是很重要的选项。如果指定了一个错误的值，则在加载这些资源的时候会收到404错误
    },
    module:{ //处理项目中的不同的模块
        rules:[//格式array,创建模块时，匹配请求的规则数组。这些规则能够对修改模块的创建方式。这些规则能够对（module）应用loader，或修改解析器（parser）
            {//本json是对js的eslint的检查
                enforce:"pre",//在babel-loader对源码进行编译前进行lint的检查
                test:/\.(js|html)$/,//检查js文件和html文件内的javascript代码的规范
                exclude:path.join(__dirname,'node_module'),
                use:[{
                    loader:"eslint-loader",
                    options:{
                        formatter: require('eslint-friendly-formatter')   // 编译后错误报告格式
                    }
                }]
            },
            {// 处理js-es6的规则
                test:/\.js$/,//匹配资源，处理的文件的后缀名
                exclude:path.join(__dirname,'node_modules'),//排除匹配的文件夹
                use:{//每个入口（entry）指定使用一个loader，处理的加载器是loader
                    loader:'babel-loader',
                    query:{
                        presets: ["es2015"]
                    }
                },
                include:path.join(__dirname,'src'),//包含的路径（匹配特定条件）
            },
            {
                test:/\.css$/,
                use:ExtractTextPlugin.extract({
                    fallback:'style-loader',
                    use:['css-loader','autoprefixer-loader'],
                    publicPath: "../"//生产环境下（也就是npm run build之后）重写资源的引入的路径,参考链接https://webpack.js.org/plugins/extract-text-webpack-plugin/#-extract
                })
            },
            {//处理css的规则,处理less的规则
                test:/\.less$/,
                use:ExtractTextPlugin.extract({
                    fallback:'style-loader',
                    use:['css-loader','autoprefixer-loader','less-loader'],
                    publicPath: "../"
                })
            },
            {//处理图片资源,样式
                test:/\.(png|svg|jpg|jpeg|gif)$/,//这里处理了以.png .svg .jpg .jpeg .gif为后缀名的图片
                use:[
                    {loader:'file-loader?limit=1024&name=images/[name].[ext]'}//加载器file-loader和npm run build之后 图片的存储文件夹
                ]
            },
            {//处理html，插入在html中的图片img用此处理
                test:/\.html$/,
                use:[
                    {loader:'html-loader'}
                ]
            },
            {//处理字体
                test:/\.(woff|woff2|eot|ttf|otf)$/,
                use:[
                    // 'file-loader'//等同于{loader:'file-loader'}
                    {loader:'file-loader?limit=1024&name=fonts/[name].[ext]'}//加载器file-loader和npm run build之后字体的存储文件夹
                ]
            },
            {//处理handlebar
                test:/\.handlebars$/,
                use:[
                    {loader:"handlebars-loader"}
                ]
            }
        ]
    },
    node:{
        fs:"empty"
    },
    plugins: [	
        new cleanWebpackPlugin(['dist/*'], {
            root: path.resolve(__dirname, '../')
        }),
		...HTMLPlugins,
        new ExtractTextPlugin({//从bundle中提取出
            filename:(getPath)=>{
                return getPath('css/[name].[chunkhash].min.css').replace('css/js', 'css');//.js文件中的.css|.less|.sass内容转换成转换成.css文件。 2017-08-09,添加hash，有利于资源管理
            },
            disable:false,//禁用插件为false
            // allChunks:true
        }),
        //new ExtractTextPlugin('css/[name].css')
    ]
}
