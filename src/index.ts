/**
 * Cloudflare Workers API for Android App
 * 使用 D1 数据库
 */

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      const url = new URL(request.url);
      const action = url.searchParams.get('action');

      if (!action) {
        return new Response(
          JSON.stringify({
            code: 400,
            message: 'action parameter is required',
            data: null,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // 统一响应格式
      let response: {
        code: number;
        message: string;
        data: any;
      } = {
        code: 0,
        message: 'success',
        data: null,
      };

      let queryResult: D1Result<any>;

      // 根据 action 执行不同的查询
      switch (action) {
        case 'get_banners':
          queryResult = await env.DB.prepare(
            'SELECT * FROM homepage_banners WHERE status = 1 ORDER BY sort_order ASC'
          ).all();
          response.data = queryResult.results || [];
          break;

        case 'get_categories':
          queryResult = await env.DB.prepare(
            'SELECT * FROM homepage_categories WHERE status = 1 ORDER BY sort_order ASC'
          ).all();
          response.data = queryResult.results || [];
          break;

        case 'get_stories':
          queryResult = await env.DB.prepare(
            'SELECT * FROM homepage_origin_stories WHERE status = 1 ORDER BY sort_order ASC'
          ).all();
          response.data = queryResult.results || [];
          break;

        case 'get_seasonal_products':
          queryResult = await env.DB.prepare(
            'SELECT * FROM homepage_products WHERE status = 1 AND is_seasonal = 1 ORDER BY sort_order ASC'
          ).all();
          response.data = queryResult.results || [];
          break;

        case 'get_popular_products':
          queryResult = await env.DB.prepare(
            'SELECT * FROM homepage_products WHERE status = 1 AND is_popular = 1 ORDER BY sort_order ASC'
          ).all();
          response.data = queryResult.results || [];
          break;

        case 'get_category_products':
          const categoryId = url.searchParams.get('category_id');
          if (!categoryId) {
            response.code = 400;
            response.message = 'category_id is required';
          } else {
            queryResult = await env.DB.prepare(
              'SELECT * FROM homepage_products WHERE status = 1 AND category_id = ? ORDER BY sort_order ASC'
            ).bind(categoryId).all();
            response.data = queryResult.results || [];
          }
          break;

        default:
          response.code = 400;
          response.message = 'Invalid action parameter';
      }

      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          code: 500,
          message: 'Server error: ' + (error.message || String(error)),
          data: null,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
